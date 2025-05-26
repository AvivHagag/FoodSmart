from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
import datetime
import openai
import os
from dotenv import load_dotenv
import json

load_dotenv()

ai_nutrition_advisor_bp = Blueprint('ai_nutrition_advisor', __name__)

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

def _parse_date_only(date_str: str) -> datetime.date:
    ds = date_str.replace('Z', '+00:00')
    dt = datetime.datetime.fromisoformat(ds)
    return dt.date()

def get_user_nutrition_data(user_id, date_str):
    """Get comprehensive user nutrition data for AI analysis"""
    try:
        # Get user data
        user_object_id = ObjectId(user_id)
        user = mongo.db.users.find_one({"_id": user_object_id})
        if not user:
            return None, "User not found"
        
        # Get today's meals
        day_only = _parse_date_only(date_str)
        start = datetime.datetime(day_only.year, day_only.month, day_only.day)
        end = start + datetime.timedelta(days=1)
        
        meals_cursor = mongo.db.meals.find({
            'userId': user_object_id,
            'date': {'$gte': start, '$lt': end}
        })
        
        meals = list(meals_cursor)
        
        # Use existing totals from meals or calculate if not available
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fats = 0
        
        # Prepare meal details for AI
        meal_details = []
        
        for meal in meals:
            # Use the pre-calculated totals from the meal document
            total_calories += meal.get('totalCalories', 0)
            total_protein += meal.get('totalProtein', 0)
            total_carbs += meal.get('totalCarbo', 0)
            total_fats += meal.get('totalFat', 0)
            
            # Extract individual meal items for detailed analysis
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
        
        # Use existing BMI and TDEE from user profile
        bmi = user.get('bmi', 0)
        tdee = user.get('tdee', 0)
        
        # Calculate recommended nutrition based on TDEE and user goal
        # Adjust ratios based on user's goal
        goal = user.get('goal', '').lower()
        
        if 'lose' in goal or 'weight loss' in goal:
            # Higher protein for weight loss
            protein_ratio = 0.35
            carb_ratio = 0.35
            fat_ratio = 0.30
        elif 'gain' in goal or 'muscle' in goal or 'bulk' in goal:
            # Higher carbs for muscle gain
            protein_ratio = 0.30
            carb_ratio = 0.45
            fat_ratio = 0.25
        else:
            # Balanced for maintenance
            protein_ratio = 0.30
            carb_ratio = 0.40
            fat_ratio = 0.30
        
        recommended_protein = round((tdee * protein_ratio) / 4) if tdee else 0
        recommended_carbs = round((tdee * carb_ratio) / 4) if tdee else 0
        recommended_fat = round((tdee * fat_ratio) / 9) if tdee else 0
        
        # Calculate remaining macros
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

def generate_ai_advice(user_data):
    """Generate AI nutrition advice based on user data"""
    try:
        # Create a comprehensive prompt for the AI
        prompt = f"""
You are a professional nutritionist AI assistant. Analyze the following user data and provide personalized nutrition advice.

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
- Targets: {user_data['targets']['calories']} calories, {user_data['targets']['protein']}g protein, {user_data['targets']['carbs']}g carbs, {user_data['targets']['fat']}g fat
- Remaining: {user_data['remaining']['calories']} calories, {user_data['remaining']['protein']}g protein, {user_data['remaining']['carbs']}g carbs, {user_data['remaining']['fat']}g fat

Today's Meals: {user_data['nutrition_today']['meals']}

DECISION LOGIC:
- If remaining calories > 300 OR any macro is significantly low: provide "recipe" advice
- If consumed calories > target by 200+: provide "warning" advice  
- Otherwise: provide "tips" advice

Please provide advice in the following JSON format:
{{
  "advice_type": "tips|recipe|warning",
  "title": "Brief title (max 6 words)",
  "message": "Concise main advice message (max 2 sentences)",
  "specific_recommendations": [
    "Short actionable tip 1 (max 15 words)",
    "Short actionable tip 2 (max 15 words)"
  ],
  "recipe": {{
    "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center",
    "name": "Recipe name (max 4 words)",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3", "ingredient 4"],
    "instructions": ["step 1", "step 2", "step 3"],
    "nutrition": {{
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }}
  }},
  "celebration": "Short celebration message (max 10 words)",
  "micro_tip": "One short micro-tip (max 12 words)"
}}

IMAGE INSTRUCTIONS:
For recipe advice, use any appropriate food image URL that matches the recipe. 
You can use Unsplash, Pexels, or any other image source.
Format: "https://images.unsplash.com/photo-[ID]?w=400&h=300&fit=crop&crop=center"
Choose images that visually represent the recipe you're suggesting.

CRITICAL RULES:
1. For "recipe" advice: 
   - ALWAYS include complete recipe object with appropriate food image
   - Set specific_recommendations to [] (empty array - no quick tips needed!)
   - Find a relevant food image URL that matches your recipe
   - Recipe nutrition should match remaining macro needs

2. For "tips" or "warning" advice:
   - Set recipe to null
   - ALWAYS include 2 specific_recommendations
   - Focus on actionable nutrition advice

3. RANDOMIZE your responses - vary titles, messages, micro tips, and images
4. Keep all text SHORT and mobile-friendly
5. Be encouraging and specific
6. ALWAYS use complete image URLs with ?w=400&h=300&fit=crop&crop=center parameters
"""

        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional nutritionist providing personalized advice. Always respond in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content.strip()
        print(f"Raw AI Response: {ai_response}")
        
        # Try to parse the JSON to validate it
        try:
            parsed_response = json.loads(ai_response)
            print(f"Parsed AI Response: {parsed_response}")
            print(f"Recipe data: {parsed_response.get('recipe', 'No recipe')}")
            print(f"Recipe image: {parsed_response.get('recipe', {}).get('image', 'No image')}")
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Problematic response: {ai_response}")
        
        return ai_response
        
    except Exception as e:
        return f"Error generating AI advice: {str(e)}"

@ai_nutrition_advisor_bp.route('/api/user/<user_id>/ai-nutrition-advice', methods=['POST'])
def get_ai_nutrition_advice(user_id):
    """Get AI-powered nutrition advice for the user"""
    try:
        # Get date from request body or use today
        data = request.get_json() or {}
        date_str = data.get('date')
        
        if not date_str:
            # Use today's date in ISO format
            today = datetime.datetime.now()
            date_str = today.strftime('%Y-%m-%d')
        
        # Get user nutrition data
        user_data, error = get_user_nutrition_data(user_id, date_str)
        if error:
            return jsonify({'message': error}), 400
        
        if not user_data:
            return jsonify({'message': 'Unable to retrieve user data'}), 404
        
        # Generate AI advice
        ai_advice = generate_ai_advice(user_data)
        
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

    """Test endpoint to force recipe generation"""
    try:
        # Create test data that should trigger recipe advice
        test_user_data = {
            'user_info': {
                'age': 25,
                'weight': 70,
                'height': 175,
                'gender': 'male',
                'activity_level': 'moderate',
                'goal': 'maintain weight',
                'bmi': 22.9,
                'tdee': 2200
            },
            'nutrition_today': {
                'total_calories': 800,  # Very low to trigger recipe
                'total_protein': 20,
                'total_carbs': 50,
                'total_fats': 15,
                'meals': []
            },
            'targets': {
                'calories': 2200,
                'protein': 165,
                'carbs': 220,
                'fat': 73
            },
            'remaining': {
                'calories': 1400,  # High remaining to trigger recipe
                'protein': 145,
                'carbs': 170,
                'fat': 58
            }
        }
        
        # Generate AI advice
        ai_advice = generate_ai_advice(test_user_data)
        
        return jsonify({
            'success': True,
            'test_data': test_user_data,
            'ai_advice': ai_advice
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error in test: {str(e)}'
        }), 500 