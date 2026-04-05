import datetime
import json
import os
import random

import requests
from bson import ObjectId
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import mongo
import extensions
from routes.auth_helpers import require_own_user

ai_nutrition_advisor_bp = Blueprint('ai_nutrition_advisor', __name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_date_only(date_str: str) -> datetime.date:
    ds = date_str.replace('Z', '+00:00')
    dt = datetime.datetime.fromisoformat(ds)
    return dt.date()


def _macro_targets(tdee: float, goal: str):
    goal_lower = goal.lower()
    if 'lose' in goal_lower or 'weight loss' in goal_lower:
        protein_ratio, carb_ratio, fat_ratio = 0.35, 0.35, 0.30
    elif 'gain' in goal_lower or 'muscle' in goal_lower or 'bulk' in goal_lower:
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.45, 0.25
    else:
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.40, 0.30

    return {
        'calories': tdee,
        'protein': round((tdee * protein_ratio) / 4) if tdee else 0,
        'carbs':   round((tdee * carb_ratio)   / 4) if tdee else 0,
        'fat':     round((tdee * fat_ratio)    / 9) if tdee else 0,
    }


def _get_user_nutrition_data(user_id: str, date_str: str):
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None, "User not found"

        day_only = _parse_date_only(date_str)
        start = datetime.datetime(day_only.year, day_only.month, day_only.day)
        end = start + datetime.timedelta(days=1)

        meals = list(mongo.db.meals.find({
            'userId': ObjectId(user_id),
            'date': {'$gte': start, '$lt': end},
        }))

        total_calories = sum(m.get('totalCalories', 0) for m in meals)
        total_protein  = sum(m.get('totalProtein',  0) for m in meals)
        total_carbs    = sum(m.get('totalCarbo',    0) for m in meals)
        total_fats     = sum(m.get('totalFat',      0) for m in meals)

        meal_details = []
        for meal in meals:
            for item in meal.get('mealsList', []):
                meal_details.append({
                    'name':     item.get('name', ''),
                    'time':     item.get('time', ''),
                    'calories': item.get('calories', 0),
                    'protein':  item.get('protein', 0),
                    'carbs':    item.get('carbo', 0),
                    'fat':      item.get('fat', 0),
                    'items':    item.get('items', ''),
                })

        tdee = user.get('tdee', 0) or 0
        targets = _macro_targets(tdee, user.get('goal', ''))

        remaining = {
            'calories': max(0, targets['calories'] - total_calories),
            'protein':  max(0, targets['protein']  - total_protein),
            'carbs':    max(0, targets['carbs']    - total_carbs),
            'fat':      max(0, targets['fat']      - total_fats),
        }

        return {
            'user_info': {
                'age':            user.get('age'),
                'weight':         user.get('weight'),
                'height':         user.get('height'),
                'gender':         user.get('gender'),
                'activity_level': user.get('activityLevel'),
                'goal':           user.get('goal'),
                'bmi':            user.get('bmi', 0),
                'tdee':           tdee,
            },
            'nutrition_today': {
                'total_calories': total_calories,
                'total_protein':  total_protein,
                'total_carbs':    total_carbs,
                'total_fats':     total_fats,
                'meals':          meal_details,
            },
            'targets':   targets,
            'remaining': remaining,
        }, None

    except Exception as e:
        return None, str(e)


def _get_weekly_data(user_id: str):
    end = datetime.datetime.now().replace(hour=23, minute=59, second=59)
    start = (end - datetime.timedelta(days=6)).replace(hour=0, minute=0, second=0)
    meals = list(mongo.db.meals.find({
        'userId': ObjectId(user_id),
        'date': {'$gte': start, '$lte': end},
    }).sort('date', 1))

    daily = {}
    for m in meals:
        key = m['date'].strftime('%A')
        if key not in daily:
            daily[key] = {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0}
        daily[key]['calories'] += m.get('totalCalories', 0)
        daily[key]['protein']  += m.get('totalProtein',  0)
        daily[key]['carbs']    += m.get('totalCarbo',    0)
        daily[key]['fat']      += m.get('totalFat',      0)
    return daily


def _get_recent_advice(user_id: str, limit: int = 5):
    docs = list(mongo.db.advice_history.find(
        {'user_id': ObjectId(user_id)},
        sort=[('created_at', -1)],
        limit=limit,
    ))
    return [d['advice'] for d in docs]


def _save_advice(user_id: str, advice: dict):
    mongo.db.advice_history.insert_one({
        'user_id': ObjectId(user_id),
        'advice':  advice,
        'created_at': datetime.datetime.utcnow(),
    })


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------

def _user_block(d):
    ui = d['user_info']
    nt = d['nutrition_today']
    tg = d['targets']
    rm = d['remaining']
    return f"""User Profile:
- Age: {ui['age']} | Weight: {ui['weight']} kg | Height: {ui['height']} cm | Gender: {ui['gender']}
- Activity Level: {ui['activity_level']} | Goal: {ui['goal']} | BMI: {ui['bmi']} | TDEE: {ui['tdee']} kcal

Today's intake: {nt['total_calories']} kcal | {nt['total_protein']}g protein | {nt['total_carbs']}g carbs | {nt['total_fats']}g fat
Targets:        {tg['calories']} kcal | {tg['protein']}g protein | {tg['carbs']}g carbs | {tg['fat']}g fat
Remaining:      {rm['calories']} kcal | {rm['protein']}g protein | {rm['carbs']}g carbs | {rm['fat']}g fat"""


def _recipe_prompt(d, recent_advice):
    recent_names = [a.get('recipe', {}).get('name', '') for a in recent_advice if a.get('recipe')]
    avoid = f"\nAvoid these recently suggested recipes: {', '.join(recent_names)}" if recent_names else ""

    styles   = ["grilled", "baked", "steamed", "air-fried", "roasted"]
    proteins = ["lean chicken breast", "wild salmon", "tofu", "egg whites", "lentils", "turkey"]
    flavors  = ["Mediterranean", "Asian-inspired", "Middle Eastern", "Italian with herbs"]

    return f"""You are a professional nutritionist. Suggest ONE healthy recipe that fits the user's remaining macros.

{_user_block(d)}{avoid}

Inspiration:
- Cooking style: {random.choice(styles)}
- Protein: {random.choice(proteins)}
- Flavor: {random.choice(flavors)}

Respond ONLY with this JSON (no markdown, no fences):
{{
  "advice_type": "recipe",
  "title": "Recipe title (max 6 words)",
  "message": "Encouraging message about this recipe (max 2 sentences)",
  "specific_recommendations": [],
  "recipe": {{
    "name": "Recipe name (max 4 words)",
    "image_keyword": "Single word for image search",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3", "ingredient 4", "ingredient 5"],
    "instructions": ["step 1", "step 2", "step 3", "step 4"],
    "nutrition": {{
      "calories": {d['remaining']['calories'] // 2},
      "protein": {d['remaining']['protein'] // 2},
      "carbs": {d['remaining']['carbs'] // 2},
      "fat": {d['remaining']['fat'] // 2}
    }}
  }},
  "celebration": null,
  "micro_tip": "Quick nutrition tip (max 12 words)"
}}"""


def _tips_prompt(d):
    pct = (d['nutrition_today']['total_calories'] / d['targets']['calories'] * 100) if d['targets']['calories'] else 0
    return f"""You are a professional nutritionist providing practical daily nutrition tips.

{_user_block(d)}
Progress: {pct:.1f}% of daily calories consumed.

Respond ONLY with this JSON (no markdown, no fences):
{{
  "advice_type": "tips",
  "title": "Tips title (max 6 words)",
  "message": "Main actionable advice (max 2 sentences)",
  "specific_recommendations": [
    "Actionable tip 1 (max 15 words)",
    "Actionable tip 2 (max 15 words)",
    "Actionable tip 3 (max 15 words)"
  ],
  "recipe": null,
  "celebration": "Encouraging message (max 10 words)",
  "micro_tip": "Quick health tip (max 12 words)"
}}"""


def _warning_prompt(d):
    over = d['nutrition_today']['total_calories'] - d['targets']['calories']
    return f"""You are a professional nutritionist providing gentle, supportive guidance.

{_user_block(d)}
Calories over target by: {over:.0f} kcal

Respond ONLY with this JSON (no markdown, no fences):
{{
  "advice_type": "warning",
  "title": "Warning title (max 6 words)",
  "message": "Gentle, supportive message (max 2 sentences)",
  "specific_recommendations": [
    "Helpful adjustment tip 1 (max 15 words)",
    "Helpful adjustment tip 2 (max 15 words)"
  ],
  "recipe": null,
  "celebration": null,
  "micro_tip": "Recovery tip (max 12 words)"
}}"""


def _meal_plan_prompt(d):
    return f"""You are a professional nutritionist. Create a practical meal plan for the REST of today to help the user hit their remaining macros.

{_user_block(d)}

Respond ONLY with this JSON (no markdown, no fences):
{{
  "advice_type": "meal_plan",
  "title": "Today's remaining meal plan",
  "message": "Brief explanation (max 2 sentences)",
  "specific_recommendations": [],
  "meal_plan": [
    {{
      "meal_name": "Snack / Lunch / Dinner",
      "foods": ["food 1", "food 2"],
      "approximate_calories": 300,
      "approximate_protein": 25,
      "approximate_carbs": 30,
      "approximate_fat": 8
    }}
  ],
  "recipe": null,
  "celebration": null,
  "micro_tip": "Quick tip (max 12 words)"
}}"""


def _weekly_summary_prompt(user_data, weekly_data):
    days_text = "\n".join(
        f"- {day}: {v['calories']:.0f} kcal | {v['protein']:.0f}g P | {v['carbs']:.0f}g C | {v['fat']:.0f}g F"
        for day, v in weekly_data.items()
    ) or "No data logged this week."

    return f"""You are a professional nutritionist analyzing a user's weekly nutrition patterns.

{_user_block(user_data)}

Daily breakdown (last 7 days):
{days_text}

Identify patterns, praise wins, flag concerns, suggest improvements.

Respond ONLY with this JSON (no markdown, no fences):
{{
  "advice_type": "weekly_summary",
  "title": "Your week in review",
  "message": "Overall assessment (max 2 sentences)",
  "specific_recommendations": [
    "Improvement tip 1 (max 15 words)",
    "Improvement tip 2 (max 15 words)",
    "Improvement tip 3 (max 15 words)"
  ],
  "recipe": null,
  "celebration": "Highlight a win this week (max 10 words)",
  "micro_tip": "Key takeaway (max 12 words)"
}}"""


# ---------------------------------------------------------------------------
# Advice type selection
# ---------------------------------------------------------------------------

def _determine_advice_type(d, recent_advice):
    remaining = d['remaining']['calories']
    over = d['nutrition_today']['total_calories'] - d['targets']['calories']
    recent_types = [a.get('advice_type') for a in recent_advice[-3:]]

    if over >= 200:
        preferred = 'warning'
    elif remaining > 500:
        preferred = random.choice(['recipe', 'meal_plan'])
    else:
        preferred = random.choice(['recipe', 'tips'])

    if recent_types.count(preferred) >= 2:
        alternates = [t for t in ['recipe', 'tips', 'meal_plan', 'warning'] if t != preferred]
        preferred = random.choice(alternates)

    return preferred


# ---------------------------------------------------------------------------
# Core AI call
# ---------------------------------------------------------------------------

def _call_ai(prompt: str, max_tokens: int = 900) -> dict:
    response = extensions.openai_client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional nutritionist. Always respond with valid JSON only. "
                    "No markdown, no code fences, no extra text."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=max_tokens,
        temperature=0.85,
    )
    content = response.choices[0].message.content.strip()
    import re
    content = re.sub(r'^```(?:json)?\s*', '', content)
    content = re.sub(r'\s*```$', '', content)
    return json.loads(content)


# ---------------------------------------------------------------------------
# Unsplash helper
# ---------------------------------------------------------------------------

def _unsplash_search(query: str):
    api_key = os.getenv('UNSPLASH_ACCESS_KEY')
    if not api_key or not query.strip():
        return None
    try:
        res = requests.get(
            "https://api.unsplash.com/search/photos",
            params={"query": f"{query} food", "orientation": "landscape", "per_page": 10, "content_filter": "high"},
            headers={"Authorization": f"Client-ID {api_key}", "Accept-Version": "v1"},
            timeout=10,
        )
        if not res.ok:
            return None
        data = res.json().get("results", [])
        return random.choice(data)["urls"]["small"] if data else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@ai_nutrition_advisor_bp.route('/api/user/<user_id>/ai-nutrition-advice', methods=['POST'])
@jwt_required()
def get_ai_nutrition_advice(user_id):
    err, code = require_own_user(user_id)
    if err:
        return err, code

    data = request.get_json() or {}
    date_str = data.get('date') or datetime.datetime.now().strftime('%Y-%m-%d')

    user_data, error = _get_user_nutrition_data(user_id, date_str)
    if error:
        return jsonify({'success': False, 'message': error}), 400

    recent_advice = _get_recent_advice(user_id)
    advice_type = _determine_advice_type(user_data, recent_advice)

    prompt_map = {
        'recipe':    lambda: _recipe_prompt(user_data, recent_advice),
        'tips':      lambda: _tips_prompt(user_data),
        'warning':   lambda: _warning_prompt(user_data),
        'meal_plan': lambda: _meal_plan_prompt(user_data),
    }
    prompt = prompt_map[advice_type]()

    try:
        parsed = _call_ai(prompt)
    except Exception as e:
        return jsonify({'success': False, 'message': f'AI generation failed: {e}'}), 500

    # Attach Unsplash image for recipe type
    if parsed.get('advice_type') == 'recipe' and parsed.get('recipe'):
        keyword = parsed['recipe'].get('image_keyword', '')
        parsed['recipe']['image'] = _unsplash_search(keyword)

    _save_advice(user_id, parsed)

    return jsonify({
        'success': True,
        'ai_advice': json.dumps(parsed),
        'date': date_str,
    }), 200


@ai_nutrition_advisor_bp.route('/api/user/<user_id>/weekly-summary', methods=['GET'])
@jwt_required()
def get_weekly_summary(user_id):
    """New endpoint: 7-day nutrition trend report."""
    err, code = require_own_user(user_id)
    if err:
        return err, code

    today = datetime.datetime.now().strftime('%Y-%m-%d')
    user_data, error = _get_user_nutrition_data(user_id, today)
    if error:
        return jsonify({'success': False, 'message': error}), 400

    weekly_data = _get_weekly_data(user_id)
    prompt = _weekly_summary_prompt(user_data, weekly_data)

    try:
        parsed = _call_ai(prompt)
    except Exception as e:
        return jsonify({'success': False, 'message': f'AI generation failed: {e}'}), 500

    _save_advice(user_id, parsed)

    return jsonify({
        'success': True,
        'ai_advice': json.dumps(parsed),
        'weekly_data': weekly_data,
    }), 200
