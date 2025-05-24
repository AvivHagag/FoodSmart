from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId

update_meal_bp = Blueprint('update_meal', __name__, url_prefix='/api/user')

@update_meal_bp.route('/<user_id>/update_meal', methods=['PUT'])
def update_user_meal(user_id):
    meal_id = request.json.get('mealId')
    meal_name = request.json.get('mealName')
    updated_meal_data = request.json.get('mealData')
    
    if not meal_id or not meal_name or not updated_meal_data:
        return jsonify({'message': 'Missing required fields: mealId, mealName, and mealData'}), 400
    
    try:
        uid = ObjectId(user_id)
        mid = ObjectId(meal_id)
    except Exception:
        return jsonify({'message': 'Invalid ID format.'}), 400
    
    meal_doc = mongo.db.meals.find_one({'_id': mid, 'userId': uid})
    
    if not meal_doc:
        return jsonify({'message': 'Meal not found or not authorized'}), 404
    
    if 'mealsList' not in meal_doc:
        return jsonify({'message': 'mealsList not found in this meal document'}), 400
    
    updated_meals_list = meal_doc['mealsList'].copy()
    meal_found = False
    
    for i, meal in enumerate(updated_meals_list):
        if meal.get('name') == meal_name:
            # Update the meal with new data
            updated_meals_list[i].update({
                'calories': round(float(updated_meal_data.get('calories', 0)), 1),
                'protein': round(float(updated_meal_data.get('protein', 0)), 1),
                'carbo': round(float(updated_meal_data.get('carbo', 0)), 1),
                'fat': round(float(updated_meal_data.get('fat', 0)), 1),
                'items': updated_meal_data.get('items', ''),
            })
            meal_found = True
            break
    
    if not meal_found:
        return jsonify({'message': f'Meal with name "{meal_name}" not found in mealsList'}), 404
    
    total_calories = round(sum(meal.get('calories', 0) for meal in updated_meals_list), 1)
    total_fat = round(sum(meal.get('fat', 0) for meal in updated_meals_list), 1)
    total_protein = round(sum(meal.get('protein', 0) for meal in updated_meals_list), 1)
    total_carbo = round(sum(meal.get('carbo', 0) for meal in updated_meals_list), 1)
    
    update_result = mongo.db.meals.update_one(
        {'_id': mid},
        {'$set': {
            'mealsList': updated_meals_list,
            'totalCalories': total_calories,
            'totalFat': total_fat,
            'totalProtein': total_protein,
            'totalCarbo': total_carbo
        }}
    )
    
    if update_result.modified_count == 0:
        return jsonify({'message': 'Failed to update meal document'}), 500
    
    return jsonify({
        'message': 'Meal updated successfully',
        'updatedMealsList': updated_meals_list,
        'totals': {
            'totalCalories': total_calories,
            'totalFat': total_fat,
            'totalProtein': total_protein,
            'totalCarbo': total_carbo
        }
    }), 200 