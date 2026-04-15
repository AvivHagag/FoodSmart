from __future__ import annotations

import json
import random
from datetime import datetime, timedelta

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.integrations.openai_client import get_openai_client
from app.integrations.unsplash_client import search_food_image
from app.repositories import advice_history as advice_history_repository
from app.repositories import meals as meals_repository
from app.repositories import users as users_repository
from app.utils.dates import day_bounds, parse_iso_date


def _macro_targets(tdee: float, goal: str | None):
    goal_lower = (goal or "").lower()
    if "lose" in goal_lower or "weight loss" in goal_lower:
        protein_ratio, carb_ratio, fat_ratio = 0.35, 0.35, 0.30
    elif "gain" in goal_lower or "muscle" in goal_lower or "bulk" in goal_lower:
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.45, 0.25
    else:
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.40, 0.30

    return {
        "calories": tdee,
        "protein": round((tdee * protein_ratio) / 4) if tdee else 0,
        "carbs": round((tdee * carb_ratio) / 4) if tdee else 0,
        "fat": round((tdee * fat_ratio) / 9) if tdee else 0,
    }


def _get_user_nutrition_data(user_id: str, date_str: str):
    user = users_repository.find_by_id(user_id)
    if not user:
        raise AppException(404, "User not found", "user_not_found")

    target_day = parse_iso_date(date_str)
    start, end = day_bounds(target_day)
    meals = meals_repository.find_by_user_and_range(user_id, start, end)

    total_calories = sum(meal.get("totalCalories", 0) for meal in meals)
    total_protein = sum(meal.get("totalProtein", 0) for meal in meals)
    total_carbs = sum(meal.get("totalCarbo", 0) for meal in meals)
    total_fats = sum(meal.get("totalFat", 0) for meal in meals)

    meal_details = []
    for meal in meals:
        for item in meal.get("mealsList", []):
            meal_details.append(
                {
                    "name": item.get("name", ""),
                    "time": item.get("time", ""),
                    "calories": item.get("calories", 0),
                    "protein": item.get("protein", 0),
                    "carbs": item.get("carbo", 0),
                    "fat": item.get("fat", 0),
                    "items": item.get("items", ""),
                }
            )

    tdee = user.get("tdee", 0) or 0
    targets = _macro_targets(tdee, user.get("goal"))
    remaining = {
        "calories": max(0, targets["calories"] - total_calories),
        "protein": max(0, targets["protein"] - total_protein),
        "carbs": max(0, targets["carbs"] - total_carbs),
        "fat": max(0, targets["fat"] - total_fats),
    }

    return {
        "user_info": {
            "age": user.get("age"),
            "weight": user.get("weight"),
            "height": user.get("height"),
            "gender": user.get("gender"),
            "activity_level": user.get("activityLevel"),
            "goal": user.get("goal"),
            "bmi": user.get("bmi", 0),
            "tdee": tdee,
        },
        "nutrition_today": {
            "total_calories": total_calories,
            "total_protein": total_protein,
            "total_carbs": total_carbs,
            "total_fats": total_fats,
            "meals": meal_details,
        },
        "targets": targets,
        "remaining": remaining,
    }


def _get_weekly_data(user_id: str):
    end = datetime.now().replace(hour=23, minute=59, second=59)
    start = (end - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    meals = meals_repository.find_by_user_and_range_inclusive(user_id, start, end)
    daily = {}
    for meal in meals:
        key = meal["date"].strftime("%A")
        if key not in daily:
            daily[key] = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        daily[key]["calories"] += meal.get("totalCalories", 0)
        daily[key]["protein"] += meal.get("totalProtein", 0)
        daily[key]["carbs"] += meal.get("totalCarbo", 0)
        daily[key]["fat"] += meal.get("totalFat", 0)
    return daily


def _get_recent_advice(user_id: str, limit: int = 5):
    docs = advice_history_repository.list_recent(user_id, limit=limit)
    return [doc.get("advice", {}) for doc in docs]


def _save_advice(user_id: str, advice: dict):
    advice_history_repository.create_record(user_id, advice)


def _user_block(data: dict) -> str:
    user_info = data["user_info"]
    nutrition_today = data["nutrition_today"]
    targets = data["targets"]
    remaining = data["remaining"]
    return f"""User Profile:
- Age: {user_info['age']} | Weight: {user_info['weight']} kg | Height: {user_info['height']} cm | Gender: {user_info['gender']}
- Activity Level: {user_info['activity_level']} | Goal: {user_info['goal']} | BMI: {user_info['bmi']} | TDEE: {user_info['tdee']} kcal

Today's intake: {nutrition_today['total_calories']} kcal | {nutrition_today['total_protein']}g protein | {nutrition_today['total_carbs']}g carbs | {nutrition_today['total_fats']}g fat
Targets:        {targets['calories']} kcal | {targets['protein']}g protein | {targets['carbs']}g carbs | {targets['fat']}g fat
Remaining:      {remaining['calories']} kcal | {remaining['protein']}g protein | {remaining['carbs']}g carbs | {remaining['fat']}g fat"""


def _recipe_prompt(data: dict, recent_advice: list[dict]) -> str:
    recent_names = [advice.get("recipe", {}).get("name", "") for advice in recent_advice if advice.get("recipe")]
    avoid = f"\nAvoid these recently suggested recipes: {', '.join(recent_names)}" if recent_names else ""
    styles = ["grilled", "baked", "steamed", "air-fried", "roasted"]
    proteins = ["lean chicken breast", "wild salmon", "tofu", "egg whites", "lentils", "turkey"]
    flavors = ["Mediterranean", "Asian-inspired", "Middle Eastern", "Italian with herbs"]
    return f"""You are a professional nutritionist. Suggest ONE healthy recipe that fits the user's remaining macros.

{_user_block(data)}{avoid}

Inspiration:
- Cooking style: {random.choice(styles)}
- Protein: {random.choice(proteins)}
- Flavor: {random.choice(flavors)}

Respond ONLY with valid JSON:
{{
  "advice_type": "recipe",
  "title": "Recipe title",
  "message": "Encouraging message",
  "specific_recommendations": [],
  "recipe": {{
    "name": "Recipe name",
    "image_keyword": "Single word for image search",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "instructions": ["step 1", "step 2", "step 3"],
    "nutrition": {{
      "calories": {data['remaining']['calories'] // 2},
      "protein": {data['remaining']['protein'] // 2},
      "carbs": {data['remaining']['carbs'] // 2},
      "fat": {data['remaining']['fat'] // 2}
    }}
  }},
  "celebration": null,
  "micro_tip": "Quick nutrition tip"
}}"""


def _tips_prompt(data: dict) -> str:
    progress = (data["nutrition_today"]["total_calories"] / data["targets"]["calories"] * 100) if data["targets"]["calories"] else 0
    return f"""You are a professional nutritionist providing practical daily nutrition tips.

{_user_block(data)}
Progress: {progress:.1f}% of daily calories consumed.

Respond ONLY with valid JSON:
{{
  "advice_type": "tips",
  "title": "Tips title",
  "message": "Main actionable advice",
  "specific_recommendations": ["Tip 1", "Tip 2", "Tip 3"],
  "recipe": null,
  "celebration": "Encouraging message",
  "micro_tip": "Quick health tip"
}}"""


def _warning_prompt(data: dict) -> str:
    over = data["nutrition_today"]["total_calories"] - data["targets"]["calories"]
    return f"""You are a professional nutritionist providing gentle, supportive guidance.

{_user_block(data)}
Calories over target by: {over:.0f} kcal

Respond ONLY with valid JSON:
{{
  "advice_type": "warning",
  "title": "Warning title",
  "message": "Gentle, supportive message",
  "specific_recommendations": ["Helpful adjustment tip 1", "Helpful adjustment tip 2"],
  "recipe": null,
  "celebration": null,
  "micro_tip": "Recovery tip"
}}"""


def _meal_plan_prompt(data: dict) -> str:
    return f"""You are a professional nutritionist. Create a practical meal plan for the rest of today to help the user hit their remaining macros.

{_user_block(data)}

Respond ONLY with valid JSON:
{{
  "advice_type": "meal_plan",
  "title": "Today's remaining meal plan",
  "message": "Brief explanation",
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
  "micro_tip": "Quick tip"
}}"""


def _weekly_summary_prompt(user_data: dict, weekly_data: dict) -> str:
    days_text = "\n".join(
        f"- {day}: {values['calories']:.0f} kcal | {values['protein']:.0f}g P | {values['carbs']:.0f}g C | {values['fat']:.0f}g F"
        for day, values in weekly_data.items()
    ) or "No data logged this week."
    return f"""You are a professional nutritionist analyzing a user's weekly nutrition patterns.

{_user_block(user_data)}

Daily breakdown (last 7 days):
{days_text}

Respond ONLY with valid JSON:
{{
  "advice_type": "weekly_summary",
  "title": "Your week in review",
  "message": "Overall assessment",
  "specific_recommendations": ["Improvement tip 1", "Improvement tip 2", "Improvement tip 3"],
  "recipe": null,
  "celebration": "Highlight a win this week",
  "micro_tip": "Key takeaway"
}}"""


def _determine_advice_type(user_data: dict, recent_advice: list[dict]) -> str:
    remaining = user_data["remaining"]["calories"]
    over = user_data["nutrition_today"]["total_calories"] - user_data["targets"]["calories"]
    recent_types = [advice.get("advice_type") for advice in recent_advice[-3:]]

    if over >= 200:
        preferred = "warning"
    elif remaining > 500:
        preferred = random.choice(["recipe", "meal_plan"])
    else:
        preferred = random.choice(["recipe", "tips"])

    if recent_types.count(preferred) >= 2:
        preferred = random.choice([item for item in ["recipe", "tips", "meal_plan", "warning"] if item != preferred])
    return preferred


def _call_ai(prompt: str, max_tokens: int = 900) -> dict:
    client = get_openai_client()
    response = client.chat.completions.create(
        model=get_settings().openai_model,
        messages=[
            {
                "role": "system",
                "content": "You are a professional nutritionist. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=max_tokens,
        temperature=0.85,
    )
    content = (response.choices[0].message.content or "").strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise AppException(500, "AI generation failed", "ai_generation_failed") from exc


def get_daily_advice(user_id: str, date_str: str | None) -> dict:
    effective_date = date_str or datetime.now().strftime("%Y-%m-%d")
    user_data = _get_user_nutrition_data(user_id, effective_date)
    recent_advice = _get_recent_advice(user_id)
    advice_type = _determine_advice_type(user_data, recent_advice)

    prompts = {
        "recipe": _recipe_prompt(user_data, recent_advice),
        "tips": _tips_prompt(user_data),
        "warning": _warning_prompt(user_data),
        "meal_plan": _meal_plan_prompt(user_data),
    }
    advice = _call_ai(prompts[advice_type])

    if advice.get("advice_type") == "recipe" and advice.get("recipe"):
        keyword = advice["recipe"].get("image_keyword", "")
        advice["recipe"]["image"] = search_food_image(keyword)

    _save_advice(user_id, advice)
    return {"advice": advice, "date": effective_date}


def get_weekly_summary(user_id: str) -> dict:
    today = datetime.now().strftime("%Y-%m-%d")
    user_data = _get_user_nutrition_data(user_id, today)
    weekly_data = _get_weekly_data(user_id)
    advice = _call_ai(_weekly_summary_prompt(user_data, weekly_data))
    _save_advice(user_id, advice)
    return {"advice": advice, "weekly_data": weekly_data}
