from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
import datetime
import openai
import os
from dotenv import load_dotenv
import json
import random
import requests

load_dotenv()

ai_nutrition_advisor_bp = Blueprint('ai_nutrition_advisor', __name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

user_recent_advice = {}

def _parse_date_only(date_str: str) -> datetime.date:
    ds = date_str.replace('Z', '+00:00')
    dt = datetime.datetime.fromisoformat(ds)
    return dt.date()

def get_user_nutrition_data(user_id, date_str):
    """Get comprehensive user nutrition data for AI analysis"""
    try:
        user_object_id = ObjectId(user_id)
        user = mongo.db.users.find_one({"_id": user_object_id})
        if not user:
            return None, "User not found"
        
        day_only = _parse_date_only(date_str)
        start = datetime.datetime(day_only.year, day_only.month, day_only.day)
        end = start + datetime.timedelta(days=1)
        
        meals_cursor = mongo.db.meals.find({
            'userId': user_object_id,
            'date': {'$gte': start, '$lt': end}
        })
        
        meals = list(meals_cursor)
        
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fats = 0
        
        meal_details = []
        
        for meal in meals:
            total_calories += meal.get('totalCalories', 0)
            total_protein += meal.get('totalProtein', 0)
            total_carbs += meal.get('totalCarbo', 0)
            total_fats += meal.get('totalFat', 0)
            
            for meal_item in meal.get('mealsList', []):
                meal_details.append({
                    'name': meal_item.get('name', ''),
                    'time': meal_item.get('time', ''),
                    'calories': meal_item.get('calories', 0),
                    'protein': meal_item.get('protein', 0),
                    'carbs': meal_item.get('carbo', 0),
                    'fat': meal_item.get('fat', 0),
                    'items': meal_item.get('items', '')
                })
        
        bmi = user.get('bmi', 0)
        tdee = user.get('tdee', 0)
        
        goal = user.get('goal', '').lower()
        
        if 'lose' in goal or 'weight loss' in goal:
            protein_ratio = 0.35
            carb_ratio = 0.35
            fat_ratio = 0.30
        elif 'gain' in goal or 'muscle' in goal or 'bulk' in goal:
            protein_ratio = 0.30
            carb_ratio = 0.45
            fat_ratio = 0.25
        else:
            protein_ratio = 0.30
            carb_ratio = 0.40
            fat_ratio = 0.30
        
        recommended_protein = round((tdee * protein_ratio) / 4) if tdee else 0
        recommended_carbs = round((tdee * carb_ratio) / 4) if tdee else 0
        recommended_fat = round((tdee * fat_ratio) / 9) if tdee else 0

        remaining_calories = max(0, tdee - total_calories) if tdee else 0
        remaining_protein = max(0, recommended_protein - total_protein)
        remaining_carbs = max(0, recommended_carbs - total_carbs)
        remaining_fat = max(0, recommended_fat - total_fats)
        
        user_data = {
            'user_info': {
                'age': user.get('age'),
                'weight': user.get('weight'),
                'height': user.get('height'),
                'gender': user.get('gender'),
                'activity_level': user.get('activityLevel'),
                'goal': user.get('goal'),
                'bmi': bmi,
                'tdee': tdee
            },
            'nutrition_today': {
                'total_calories': total_calories,
                'total_protein': total_protein,
                'total_carbs': total_carbs,
                'total_fats': total_fats,
                'meals': meal_details
            },
            'targets': {
                'calories': tdee,
                'protein': recommended_protein,
                'carbs': recommended_carbs,
                'fat': recommended_fat
            },
            'remaining': {
                'calories': remaining_calories,
                'protein': remaining_protein,
                'carbs': remaining_carbs,
                'fat': remaining_fat
            }
        }
        
        return user_data, None
        
    except Exception as e:
        return None, str(e)

def generate_recipe_prompt(user_data, recent_recipes=None):
    """Generate prompt for recipe advice with randomization and duplicate avoidance"""
    recent_recipe_names = []
    if recent_recipes:
        recent_recipe_names = [recipe.get('recipe', {}).get('name', '') for recipe in recent_recipes if recipe.get('recipe')]
    
    avoid_recipes_text = ""
    if recent_recipe_names:
        avoid_recipes_text = f"\nAVOID these recent recipes: {', '.join(recent_recipe_names)}"
    
    healthy_cooking_styles = ["grilled", "baked", "steamed", "air-fried", "roasted", "poached", "sautéed with minimal oil"]
    healthy_protein_sources = ["lean chicken breast", "wild salmon", "tofu", "egg whites", "black beans", "quinoa", "lentils", "Greek yogurt", "cottage cheese"]
    healthy_flavor_profiles = ["Mediterranean", "Asian-inspired", "Mexican-style with fresh herbs", "Italian with herbs", "Middle Eastern", "fresh and light", "herb-crusted"]
    
    superfoods = ["spinach", "kale", "blueberries", "avocado", "sweet potato", "broccoli", "chia seeds", "almonds"]
    healthy_carbs = ["quinoa", "brown rice", "sweet potato", "oats", "whole grain pasta", "cauliflower rice"]
    healthy_fats = ["olive oil", "avocado", "nuts", "seeds", "fatty fish"]
    
    random_style = random.choice(healthy_cooking_styles)
    random_protein = random.choice(healthy_protein_sources)
    random_flavor = random.choice(healthy_flavor_profiles)
    random_superfood = random.choice(superfoods)
    random_healthy_carb = random.choice(healthy_carbs)
    
    return f"""
You are a professional nutritionist AI assistant providing a HEALTHY RECIPE recommendation.

User Profile:
- Age: {user_data['user_info']['age']} years
- Weight: {user_data['user_info']['weight']} kg
- Height: {user_data['user_info']['height']} cm
- Gender: {user_data['user_info']['gender']}
- Activity Level: {user_data['user_info']['activity_level']}
- Goal: {user_data['user_info']['goal']}
- BMI: {user_data['user_info']['bmi']}
- TDEE: {user_data['user_info']['tdee']} calories

Today's Nutrition:
- Consumed: {user_data['nutrition_today']['total_calories']} calories, {user_data['nutrition_today']['total_protein']}g protein, {user_data['nutrition_today']['total_carbs']}g carbs, {user_data['nutrition_today']['total_fats']}g fat
- Remaining: {user_data['remaining']['calories']} calories, {user_data['remaining']['protein']}g protein, {user_data['remaining']['carbs']}g carbs, {user_data['remaining']['fat']}g fat

HEALTHY CREATIVITY INSPIRATION:
- Try a {random_style} cooking method
- Consider {random_protein} as protein source
- Explore {random_flavor} flavors
- Include {random_superfood} for extra nutrients
- Use {random_healthy_carb} as healthy carb base{avoid_recipes_text}

Provide a HEALTHY recipe suggestion in this JSON format:
{{
  "advice_type": "recipe",
  "title": "Recipe title (max 6 words)",
  "message": "Brief encouraging message about the recipe (max 2 sentences)",
  "specific_recommendations": [],
  "recipe": {{
    "name": "Recipe name (max 4 words)",
    "image_keyword": "Single word describing the main ingredient or dish type (e.g., 'chicken', 'salmon', 'pasta', 'salad')",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3", "ingredient 4", "ingredient 5"],
    "instructions": ["step 1", "step 2", "step 3", "step 4"],
    "nutrition": {{
      "calories": {user_data['remaining']['calories'] // 2},
      "protein": {user_data['remaining']['protein'] // 2},
      "carbs": {user_data['remaining']['carbs'] // 2},
      "fat": {user_data['remaining']['fat'] // 2}
    }}
  }},
  "celebration": null,
  "micro_tip": "Quick nutrition tip (max 12 words)"
}}

HEALTHY RECIPE REQUIREMENTS:
- PRIORITIZE HEALTH: Use nutrient-dense, whole food ingredients
- AVOID: Processed foods, excessive sugar, refined carbs, deep frying
- INCLUDE: Fresh vegetables, lean proteins, healthy fats, whole grains
- COOKING METHODS: Prefer grilling, baking, steaming, sautéing with minimal oil
- SUPERFOODS: Try to include at least one superfood ingredient
- LOW SODIUM: Use herbs and spices instead of excessive salt
- FIBER-RICH: Include high-fiber ingredients for satiety and health
- ANTIOXIDANTS: Incorporate colorful vegetables and fruits
- BE CREATIVE and UNIQUE - avoid common/boring recipes
- Choose a recipe that helps fill the remaining macro gaps
- Make the recipe realistic and achievable
- Focus on the user's goal: {user_data['user_info']['goal']}
- Keep ingredients simple and accessible
- Try different healthy cuisines and cooking methods
- The image_keyword should be a single, clear word that best represents the dish for image searching
- I will automatically find an appropriate image for your recipe using the image_keyword
"""

def generate_tips_prompt(user_data):
    """Generate prompt for general nutrition tips"""
    return f"""
You are a professional nutritionist AI assistant providing GENERAL NUTRITION TIPS.

User Profile:
- Age: {user_data['user_info']['age']} years
- Weight: {user_data['user_info']['weight']} kg
- Height: {user_data['user_info']['height']} cm
- Gender: {user_data['user_info']['gender']}
- Activity Level: {user_data['user_info']['activity_level']}
- Goal: {user_data['user_info']['goal']}
- BMI: {user_data['user_info']['bmi']}
- TDEE: {user_data['user_info']['tdee']} calories

Today's Nutrition:
- Consumed: {user_data['nutrition_today']['total_calories']} calories, {user_data['nutrition_today']['total_protein']}g protein, {user_data['nutrition_today']['total_carbs']}g carbs, {user_data['nutrition_today']['total_fats']}g fat
- Progress: {(user_data['nutrition_today']['total_calories'] / user_data['targets']['calories'] * 100):.1f}% of daily calories

Provide nutrition tips in this JSON format:
{{
  "advice_type": "tips",
  "title": "Tips title (max 6 words)",
  "message": "Main advice message (max 2 sentences)",
  "specific_recommendations": [
    "Actionable tip 1 (max 15 words)",
    "Actionable tip 2 (max 15 words)"
  ],
  "recipe": null,
  "celebration": "Encouraging message (max 10 words)",
  "micro_tip": "Quick health tip (max 12 words)"
}}

TIPS FOCUS AREAS:
- Hydration and meal timing
- Macro balance optimization
- Healthy snack suggestions
- Portion control strategies
- Goal-specific advice for: {user_data['user_info']['goal']}
- Activity level considerations
"""

def generate_warning_prompt(user_data):
    """Generate prompt for nutrition warnings"""
    calories_over = user_data['nutrition_today']['total_calories'] - user_data['targets']['calories']
    
    return f"""
You are a professional nutritionist AI assistant providing a NUTRITION WARNING.

User Profile:
- Age: {user_data['user_info']['age']} years
- Weight: {user_data['user_info']['weight']} kg
- Goal: {user_data['user_info']['goal']}
- TDEE: {user_data['user_info']['tdee']} calories

Today's Nutrition CONCERN:
- Consumed: {user_data['nutrition_today']['total_calories']} calories
- Target: {user_data['targets']['calories']} calories
- OVER TARGET BY: {calories_over} calories

Provide a gentle warning in this JSON format:
{{
  "advice_type": "warning",
  "title": "Warning title (max 6 words)",
  "message": "Gentle, supportive warning message (max 2 sentences)",
  "specific_recommendations": [
    "Helpful adjustment tip 1 (max 15 words)",
    "Helpful adjustment tip 2 (max 15 words)"
  ],
  "recipe": null,
  "celebration": null,
  "micro_tip": "Recovery tip (max 12 words)"
}}

WARNING GUIDELINES:
- Be supportive, not judgmental
- Focus on tomorrow's improvements
- Suggest light activities or adjustments
- Emphasize that one day doesn't define progress
- Provide actionable next steps
"""

def get_recent_advice_for_user(user_id):
    """Get recent advice for a user"""
    return user_recent_advice.get(user_id, [])

def add_advice_to_recent(user_id, advice_data):
    """Add advice to recent list for a user"""
    if user_id not in user_recent_advice:
        user_recent_advice[user_id] = []
    
    user_recent_advice[user_id].append(advice_data)
    if len(user_recent_advice[user_id]) > 5:
        user_recent_advice[user_id] = user_recent_advice[user_id][-5:]

def determine_advice_type(user_data, user_id):
    """Determine which type of advice to give based on user data and recent history"""
    remaining_calories = user_data['remaining']['calories']
    consumed_calories = user_data['nutrition_today']['total_calories']
    target_calories = user_data['targets']['calories']
    
    calories_over = consumed_calories - target_calories
    
    recent_advice = get_recent_advice_for_user(user_id)
    recent_types = [advice.get('advice_type') for advice in recent_advice[-3:]]
    
    if remaining_calories > 400:  
        preferred_type = 'recipe'
    elif calories_over > 300:  
        preferred_type = 'warning'
    elif remaining_calories > 200:  
        preferred_type = random.choice(['recipe', 'tips'])
    else:  
        preferred_type = random.choice(['tips', 'tips', 'recipe'])
    
    if recent_types.count(preferred_type) >= 3 :
        if preferred_type == 'recipe':
            alternative_type = random.choice(['tips', 'warning'] if calories_over > 100 else ['tips'])
        elif preferred_type == 'tips':
            alternative_type = 'recipe' if remaining_calories > 200 else 'warning'
        else: 
            alternative_type = random.choice(['tips', 'recipe'])
        
        return alternative_type
    
    return preferred_type

def generate_ai_advice(user_data, user_id):
    """Generate AI nutrition advice based on user data with duplicate prevention"""
    try:
        recent_advice = get_recent_advice_for_user(user_id)
        
        advice_type = determine_advice_type(user_data, user_id)
        
        if advice_type == 'recipe':
            prompt = generate_recipe_prompt(user_data, recent_advice)
        elif advice_type == 'warning':
            prompt = generate_warning_prompt(user_data)
        else:  
            prompt = generate_tips_prompt(user_data)
        
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional nutritionist providing personalized advice. Always respond in valid JSON format. Be creative and avoid repetitive suggestions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.9
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        try:
            parsed_response = json.loads(ai_response)
            
            if parsed_response.get('advice_type') == 'recipe' and parsed_response.get('recipe'):
                recipe_data = parsed_response['recipe']
                recipe_name = recipe_data.get('name', '')
                if recipe_name:
                    image_url = search_recipe_image_web(recipe_data)
                    if image_url:
                        parsed_response['recipe']['image'] = image_url
                    else:
                        parsed_response['recipe']['image'] = None
                    
                    ai_response = json.dumps(parsed_response)
            
            add_advice_to_recent(user_id, parsed_response)
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Problematic response: {ai_response}")
        
        return ai_response
        
    except Exception as e:
        return f"Error generating AI advice: {str(e)}"

def unsplash_search(query: str) -> str | None:
    """Return a high-quality Unsplash photo URL for the query or None."""
    api_key = os.getenv('UNSPLASH_ACCESS_KEY')
    if not api_key:
        return None
    
    clean_query = query.strip()
    if not clean_query:
        return None
    
    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": clean_query,
        "orientation": "landscape",
        "per_page": 10,
        "content_filter": "high"
    }
    headers = {
        "Authorization": f"Client-ID {api_key}",
        "Accept-Version": "v1"
    }
    
    try:
        res = requests.get(url, params=params, headers=headers, timeout=10)
        
        if res.status_code == 400:
            print(f"Unsplash API error 400: Bad Request. Query might be invalid: '{clean_query}'")
            return None
        elif res.status_code == 401:
            print(f"Unsplash API error 401: Invalid access token. Please check your UNSPLASH_ACCESS_KEY")
            return None
        elif res.status_code == 403:
            print(f"Unsplash API error 403: Rate limit exceeded or access forbidden")
            return None
        
        res.raise_for_status()
        data = res.json().get("results", [])
        if not data:
            return None
        
        selected_photo = random.choice(data)
        image_url = selected_photo["urls"]["small"]
        return image_url
        
    except requests.exceptions.RequestException as exc:
        print(f"Unsplash API request failed: {exc}")
        return None
    except Exception as exc:
        print(f"Unsplash lookup failed: {exc}")
        return None

def search_recipe_image_web(recipe_data):
    """Search for recipe images using Unsplash API with AI-provided keyword"""
    try:
        image_keyword = recipe_data.get('image_keyword', '')
        recipe_name = recipe_data.get('name', '')
        
        if not image_keyword:
            return None

        api_key = os.getenv('UNSPLASH_ACCESS_KEY')
        if not api_key:
            return None
        
        search_term = f"{image_keyword} food"
        image_url = unsplash_search(search_term)
        
        if image_url:
            return image_url
        else:
            return None
        
    except Exception as e:
        print(f"Error in Unsplash search: {e}")
        return None

@ai_nutrition_advisor_bp.route('/api/user/<user_id>/ai-nutrition-advice', methods=['POST'])
def get_ai_nutrition_advice(user_id):
    """Get AI-powered nutrition advice for the user"""
    try:
        data = request.get_json() or {}
        date_str = data.get('date')
        
        if not date_str:
            today = datetime.datetime.now()
            date_str = today.strftime('%Y-%m-%d')
        
        user_data, error = get_user_nutrition_data(user_id, date_str)
        if error:
            return jsonify({'message': error}), 400
        
        if not user_data:
            return jsonify({'message': 'Unable to retrieve user data'}), 404
        
        ai_advice = generate_ai_advice(user_data, user_id)
        
        return jsonify({
            'success': True,
            'user_data': user_data,
            'ai_advice': ai_advice,
            'date': date_str
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error generating nutrition advice: {str(e)}'
        }), 500 