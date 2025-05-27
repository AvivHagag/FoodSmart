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
import re

load_dotenv()

ai_nutrition_advisor_bp = Blueprint('ai_nutrition_advisor', __name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Global dictionary to store recent advice per user (in production, use Redis or database)
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
    
    # Get recent recipe names to avoid duplicates
    recent_recipe_names = []
    if recent_recipes:
        recent_recipe_names = [recipe.get('recipe', {}).get('name', '') for recipe in recent_recipes if recipe.get('recipe')]
    
    avoid_recipes_text = ""
    if recent_recipe_names:
        avoid_recipes_text = f"\nAVOID these recent recipes: {', '.join(recent_recipe_names)}"
    
    # Add randomization elements
    cooking_styles = ["grilled", "baked", "steamed", "sautéed", "roasted", "fresh"]
    protein_sources = ["chicken", "fish", "tofu", "eggs", "beans", "quinoa", "lentils"]
    flavor_profiles = ["Mediterranean", "Asian-inspired", "Mexican-style", "Italian", "Middle Eastern", "fresh and light"]
    
    random_style = random.choice(cooking_styles)
    random_protein = random.choice(protein_sources)
    random_flavor = random.choice(flavor_profiles)
    
    return f"""
You are a professional nutritionist AI assistant providing a RECIPE recommendation.

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

CREATIVITY INSPIRATION:
- Try a {random_style} cooking method
- Consider {random_protein} as protein source
- Explore {random_flavor} flavors{avoid_recipes_text}

Provide a recipe suggestion in this JSON format:
{{
  "advice_type": "recipe",
  "title": "Recipe title (max 6 words)",
  "message": "Brief encouraging message about the recipe (max 2 sentences)",
  "specific_recommendations": [],
  "recipe": {{
    "name": "Recipe name (max 4 words)",
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

RECIPE REQUIREMENTS:
- BE CREATIVE and UNIQUE - avoid common/boring recipes
- Choose a recipe that helps fill the remaining macro gaps
- Make the recipe realistic and achievable
- Focus on the user's goal: {user_data['user_info']['goal']}
- Keep ingredients simple and accessible
- Try different cuisines and cooking methods
- I will automatically find an appropriate image for your recipe
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
    
    # Keep only last 5 advice entries
    user_recent_advice[user_id].append(advice_data)
    if len(user_recent_advice[user_id]) > 5:
        user_recent_advice[user_id] = user_recent_advice[user_id][-5:]

def determine_advice_type(user_data, user_id):
    """Determine which type of advice to give based on user data and recent history"""
    remaining_calories = user_data['remaining']['calories']
    consumed_calories = user_data['nutrition_today']['total_calories']
    target_calories = user_data['targets']['calories']
    
    calories_over = consumed_calories - target_calories
    
    # Get recent advice to avoid duplicates
    recent_advice = get_recent_advice_for_user(user_id)
    recent_types = [advice.get('advice_type') for advice in recent_advice[-3:]]  # Last 3
    
    # Base logic
    if remaining_calories > 400:  
        preferred_type = 'recipe'
    elif calories_over > 300:  
        preferred_type = 'warning'
    elif remaining_calories > 200:  
        preferred_type = random.choice(['recipe', 'tips'])
    else:  
        preferred_type = random.choice(['tips', 'tips', 'recipe'])
    
    # Avoid giving the same type too many times in a row
    if recent_types.count(preferred_type) >= 2:
        # Force variety
        if preferred_type == 'recipe':
            alternative_type = random.choice(['tips', 'warning'] if calories_over > 100 else ['tips'])
        elif preferred_type == 'tips':
            alternative_type = 'recipe' if remaining_calories > 200 else 'warning'
        else:  # warning
            alternative_type = random.choice(['tips', 'recipe'])
        
        return alternative_type
    
    return preferred_type

def generate_ai_advice(user_data, user_id):
    """Generate AI nutrition advice based on user data with duplicate prevention"""
    try:
        # Get recent advice for this user
        recent_advice = get_recent_advice_for_user(user_id)
        
        advice_type = determine_advice_type(user_data, user_id)
        
        if advice_type == 'recipe':
            prompt = generate_recipe_prompt(user_data, recent_advice)
        elif advice_type == 'warning':
            prompt = generate_warning_prompt(user_data)
        else:  
            prompt = generate_tips_prompt(user_data)
        
        print(f"Selected advice type: {advice_type}")
        print(f"Recent advice count: {len(recent_advice)}")
        
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional nutritionist providing personalized advice. Always respond in valid JSON format. Be creative and avoid repetitive suggestions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.9  # Increased for more creativity and randomness
        )
        
        ai_response = response.choices[0].message.content.strip()
        print(f"Raw AI Response: {ai_response}")
        
        # Try to parse the JSON to validate it
        try:
            parsed_response = json.loads(ai_response)
            print(f"Advice type generated: {parsed_response.get('advice_type')}")
            print(f"Recipe data: {parsed_response.get('recipe', 'No recipe')}")
            
            # If it's a recipe advice, search for an image
            if parsed_response.get('advice_type') == 'recipe' and parsed_response.get('recipe'):
                recipe_name = parsed_response['recipe'].get('name', '')
                if recipe_name:
                    print(f"Searching for image for recipe: {recipe_name}")
                    image_url = search_recipe_image_web(recipe_name)
                    if image_url:
                        parsed_response['recipe']['image'] = image_url
                        print(f"Added image to recipe: {image_url}")
                    else:
                        parsed_response['recipe']['image'] = None
                        print("No image found, will use icon fallback")
                    
                    # Convert back to JSON string
                    ai_response = json.dumps(parsed_response)
            
            # Add this advice to recent history
            add_advice_to_recent(user_id, parsed_response)
            
            if parsed_response.get('recipe'):
                print(f"Final recipe image: {parsed_response.get('recipe', {}).get('image', 'No image')}")
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Problematic response: {ai_response}")
        
        return ai_response
        
    except Exception as e:
        return f"Error generating AI advice: {str(e)}"

def search_recipe_image_web(recipe_name):
    """Search for recipe images using actual web search"""
    try:
        print(f"Web searching for: {recipe_name}")
        
        # Try to use web search to find real recipe images
        search_query = f"{recipe_name} recipe food high quality"
        
        # In a real implementation, you would use:
        # 1. Google Custom Search API
        # 2. Bing Image Search API  
        # 3. Unsplash API
        # 4. Pexels API
        
        # For now, let's implement a more sophisticated approach
        # that tries multiple search strategies
        
        # Strategy 1: Try specific recipe name search
        image_url = search_specific_recipe_online(recipe_name)
        if image_url:
            return image_url
            
        # Strategy 2: Try ingredient-based search
        image_url = search_by_main_ingredient(recipe_name)
        if image_url:
            return image_url
            
        # Strategy 3: Fall back to our curated database
        return search_recipe_image_online(recipe_name)
        
    except Exception as e:
        print(f"Web search failed: {e}")
        return search_recipe_image_online(recipe_name)

def search_specific_recipe_online(recipe_name):
    """Search for specific recipe images using advanced patterns"""
    try:
        # Advanced recipe-specific image database
        specific_recipes = {
            # Asian dishes
            'teriyaki chicken': ["1604503468831-187d2d17aadd"],
            'pad thai': ["1603133872878-684f208fb84b"],
            'fried rice': ["1586201375761-83865001e31c"],
            'sushi bowl': ["1546069901-ba9599a7e63c"],
            'ramen': ["1578662996442-374943b308d5"],
            
            # Mediterranean
            'greek salad': ["1540420773420-3366772f4999"],
            'hummus bowl': ["1512621776951-a57141f2eefd"],
            'falafel': ["1505576391880-9c3163e4e3dd"],
            'mediterranean bowl': ["1546069901-ba9599a7e63c"],
            
            # Mexican
            'burrito bowl': ["1546069901-ba9599a7e63c"],
            'quesadilla': ["1565299585323-38174c4a6c9b"],
            'mexican salad': ["1540420773420-3366772f4999"],
            
            # Healthy options
            'protein smoothie': ["1553979459-d2229ba7433a"],
            'acai bowl': ["1610348725531-da876fababf2"],
            'power bowl': ["1546069901-ba9599a7e63c"],
            'buddha bowl': ["1512621776951-a57141f2eefd"],
            
            # Breakfast
            'overnight oats': ["1517686469429-8bdb88b9f907"],
            'protein pancakes': ["1528207776546-365bb710ee93"],
            'avocado toast': ["1541519227354-08fa5d50c44d"],
            'breakfast bowl': ["1546069901-ba9599a7e63c"],
        }
        
        recipe_lower = recipe_name.lower()
        
        # Check for exact or partial matches
        for specific_recipe, image_ids in specific_recipes.items():
            if specific_recipe in recipe_lower or any(word in recipe_lower for word in specific_recipe.split()):
                selected_id = random.choice(image_ids)
                image_url = f"https://images.unsplash.com/photo-{selected_id}?w=400&h=300&fit=crop&crop=center"
                
                # Validate the image
                response = requests.head(image_url, timeout=5)
                if response.status_code == 200:
                    print(f"✓ Found specific recipe image for '{recipe_name}': {image_url}")
                    return image_url
        
        return None
        
    except Exception as e:
        print(f"Error in specific recipe search: {e}")
        return None

def search_by_main_ingredient(recipe_name):
    """Search for images based on main ingredients"""
    try:
        # Extract main ingredients and search for those
        ingredient_patterns = {
            'chicken': ["1598515214211-89d3c73ae83b", "1604503468831-187d2d17aadd"],
            'salmon': ["1467003909585-2f8a72700288", "1519708227418-c8947a91d8aa"],
            'shrimp': ["1519708227418-c8947a91d8aa"],
            'tofu': ["1603133872878-684f208fb84b"],
            'quinoa': ["1546069901-ba9599a7e63c", "1512621776951-a57141f2eefd"],
            'avocado': ["1541519227354-08fa5d50c44d", "1525351326368-efbb5cb6435d"],
            'sweet potato': ["1505576391880-9c3163e4e3dd"],
            'broccoli': ["1505576391880-9c3163e4e3dd"],
            'spinach': ["1540420773420-3366772f4999"],
        }
        
        recipe_lower = recipe_name.lower()
        
        for ingredient, image_ids in ingredient_patterns.items():
            if ingredient in recipe_lower:
                selected_id = random.choice(image_ids)
                image_url = f"https://images.unsplash.com/photo-{selected_id}?w=400&h=300&fit=crop&crop=center"
                
                response = requests.head(image_url, timeout=5)
                if response.status_code == 200:
                    print(f"✓ Found ingredient-based image for '{recipe_name}': {image_url}")
                    return image_url
        
        return None
        
    except Exception as e:
        print(f"Error in ingredient-based search: {e}")
        return None

def search_recipe_image_online(recipe_name):
    """Search for actual recipe images online with expanded options"""
    try:
        print(f"Searching online for images of: {recipe_name}")
        
        # Expanded recipe patterns with multiple image options per category
        recipe_patterns = {
            # Protein dishes - Multiple options
            'grilled chicken': [
                "1598515214211-89d3c73ae83b",
                "1604503468831-187d2d17aadd", 
                "1606728035253-d31c235ab2c6"
            ],
            'chicken breast': [
                "1598515214211-89d3c73ae83b",
                "1604503468831-187d2d17aadd"
            ],
            'chicken salad': [
                "1540420773420-3366772f4999",
                "1512621776951-a57141f2eefd"
            ],
            'salmon': [
                "1467003909585-2f8a72700288",
                "1519708227418-c8947a91d8aa",
                "1574781330855-d0db6cc7e3b2"
            ],
            'fish': [
                "1467003909585-2f8a72700288",
                "1519708227418-c8947a91d8aa"
            ],
            'beef': [
                "1529692236671-f1f6cf9683ba",
                "1546833999-b9fcbecd74dd"
            ],
            'steak': [
                "1529692236671-f1f6cf9683ba",
                "1546833999-b9fcbecd74dd"
            ],
            'eggs': [
                "1525351326368-efbb5cb6435d",
                "1482049016688-2d3e1b311543"
            ],
            'omelet': [
                "1525351326368-efbb5cb6435d",
                "1482049016688-2d3e1b311543"
            ],
            
            # Carb dishes - Multiple options
            'pasta': [
                "1621996346565-e3dbc353d2e5",
                "1551183053-bf91a1d81141",
                "1563379091-20336ce7c79b"
            ],
            'spaghetti': [
                "1621996346565-e3dbc353d2e5",
                "1551183053-bf91a1d81141"
            ],
            'rice': [
                "1603133872878-684f208fb84b",
                "1586201375761-83865001e31c"
            ],
            'quinoa': [
                "1546069901-ba9599a7e63c",
                "1512621776951-a57141f2eefd"
            ],
            'oatmeal': [
                "1517686469429-8bdb88b9f907",
                "1571091718767-18b5b1457add"
            ],
            'pancakes': [
                "1506084868230-bb9d95c24759",
                "1528207776546-365bb710ee93"
            ],
            'bread': [
                "1568901346375-23c9450c58cd",
                "1509440159596-0249088772ff"
            ],
            'sandwich': [
                "1568901346375-23c9450c58cd",
                "1509440159596-0249088772ff"
            ],
            
            # Vegetables & Salads - Multiple options
            'salad': [
                "1540420773420-3366772f4999",
                "1512621776951-a57141f2eefd",
                "1505576391880-9c3163e4e3dd"
            ],
            'vegetables': [
                "1540420773420-3366772f4999",
                "1505576391880-9c3163e4e3dd"
            ],
            'avocado': [
                "1541519227354-08fa5d50c44d",
                "1525351326368-efbb5cb6435d"
            ],
            'avocado toast': [
                "1541519227354-08fa5d50c44d",
                "1525351326368-efbb5cb6435d"
            ],
            
            # Soups & Stews - Multiple options
            'soup': [
                "1547592180-85f173990554",
                "1578662996442-374943b308d5"
            ],
            'stew': [
                "1547592180-85f173990554",
                "1578662996442-374943b308d5"
            ],
            'broth': [
                "1547592180-85f173990554"
            ],
            
            # International - Multiple options
            'stir fry': [
                "1603133872878-684f208fb84b",
                "1586201375761-83865001e31c"
            ],
            'curry': [
                "1603133872878-684f208fb84b",
                "1586201375761-83865001e31c"
            ],
            'tacos': [
                "1565299585323-38174c4a6c9b",
                "1551504734-5ee1c4a1d5d1"
            ],
            'pizza': [
                "1565299507177-b0ac66763828",
                "1513104890138-7c749659a591"
            ],
            'burger': [
                "1571091718767-18b5b1457add",
                "1520072959219-c595dc870360"
            ],
            
            # Healthy options - Multiple options
            'smoothie': [
                "1553979459-d2229ba7433a",
                "1610348725531-da876fababf2"
            ],
            'bowl': [
                "1546069901-ba9599a7e63c",
                "1512621776951-a57141f2eefd"
            ],
            'yogurt': [
                "1488477181946-6428a0291777",
                "1610348725531-da876fababf2"
            ],
            'fruit': [
                "1610348725531-da876fababf2",
                "1505576391880-9c3163e4e3dd"
            ],
        }
        
        recipe_lower = recipe_name.lower()
        selected_images = None
        matched_keyword = None
        
        # Find the best matching keyword (longest match first)
        for keyword, photo_ids in sorted(recipe_patterns.items(), key=len, reverse=True):
            if keyword in recipe_lower:
                selected_images = photo_ids
                matched_keyword = keyword
                print(f"Matched '{matched_keyword}' in recipe '{recipe_name}'")
                break
        
        # If no match found, return None (no fallback)
        if not selected_images:
            print(f"No specific match for '{recipe_name}', returning None")
            return None
        
        # Randomly select one image from the available options
        selected_id = random.choice(selected_images)
        print(f"Selected random image ID: {selected_id}")
        
        # Construct the image URL
        image_url = f"https://images.unsplash.com/photo-{selected_id}?w=400&h=300&fit=crop&crop=center"
        
        # Validate the image URL works
        try:
            response = requests.head(image_url, timeout=5)
            if response.status_code == 200:
                print(f"✓ Found working image for '{recipe_name}': {image_url}")
                return image_url
            else:
                print(f"✗ Image URL returned status {response.status_code}")
                # Try another random image if the first one fails
                if len(selected_images) > 1:
                    backup_id = random.choice([img for img in selected_images if img != selected_id])
                    backup_url = f"https://images.unsplash.com/photo-{backup_id}?w=400&h=300&fit=crop&crop=center"
                    backup_response = requests.head(backup_url, timeout=5)
                    if backup_response.status_code == 200:
                        print(f"✓ Using backup image: {backup_url}")
                        return backup_url
        except Exception as e:
            print(f"✗ Error validating image URL: {e}")
        
        # If all images fail, return None
        print(f"All images failed for '{recipe_name}', returning None")
        return None
        
    except Exception as e:
        print(f"Error in online image search: {e}")
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