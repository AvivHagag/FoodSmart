from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import mongo
from bson import ObjectId
from routes.auth_helpers import require_own_user

delete_meal_bp = Blueprint('delete_meal', __name__, url_prefix='/api/user')


@delete_meal_bp.route('/<user_id>/delete_meal', methods=['DELETE'])
@jwt_required()
def delete_user_meal(user_id):
    err, code = require_own_user(user_id)
    if err:
        return err, code

    meal_id = request.json.get('mealId')
    meal_name = request.json.get('mealName')

    if not meal_id or not meal_name:
        return jsonify({'message': 'Missing required fields: mealId and mealName'}), 400

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

    updated_meals_list = [m for m in meal_doc['mealsList'] if m.get('name') != meal_name]

    if len(updated_meals_list) == len(meal_doc['mealsList']):
        return jsonify({'message': f'Meal with name "{meal_name}" not found in mealsList'}), 404

    for i, meal in enumerate(updated_meals_list):
        meal['name'] = f"Meal {i + 1}"

    update_result = mongo.db.meals.update_one(
        {'_id': mid},
        {'$set': {'mealsList': updated_meals_list}}
    )

    if update_result.modified_count == 0:
        return jsonify({'message': 'Failed to update meal document'}), 500

    total_calories = round(sum(m.get('calories', 0) for m in updated_meals_list), 1)
    total_fat = round(sum(m.get('fat', 0) for m in updated_meals_list), 1)
    total_protein = round(sum(m.get('protein', 0) for m in updated_meals_list), 1)
    total_carbo = round(sum(m.get('carbo', 0) for m in updated_meals_list), 1)

    mongo.db.meals.update_one(
        {'_id': mid},
        {'$set': {
            'totalCalories': total_calories,
            'totalFat': total_fat,
            'totalProtein': total_protein,
            'totalCarbo': total_carbo,
        }}
    )

    return jsonify({
        'message': 'Meal deleted and totals recalculated successfully',
        'updatedMealsList': updated_meals_list,
    }), 200
