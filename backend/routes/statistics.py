from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import mongo
from bson import ObjectId
from datetime import datetime, timedelta
from routes.auth_helpers import require_own_user

statistics_bp = Blueprint('statistics', __name__, url_prefix='/api/statistics')


def get_date_range(range_type):
    end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)

    days = {"Week": 6, "30 Days": 29, "60 Days": 59, "90 Days": 89}.get(range_type, 6)
    start_date = (end_date - timedelta(days=days)).replace(hour=0, minute=0, second=0, microsecond=0)

    return start_date, end_date


@statistics_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user_meals_and_goals(user_id):
    err, code = require_own_user(user_id)
    if err:
        return err, code

    range_type = request.args.get('range', 'Week')

    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return jsonify({'error': 'Invalid user ID format'}), 400

    user = mongo.db.users.find_one({"_id": user_oid})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    start_date, end_date = get_date_range(range_type)

    meals_cursor = mongo.db.meals.find({
        'userId': user_oid,
        'date': {'$gte': start_date, '$lte': end_date},
    }).sort('date', 1)

    meals_data = []
    for meal_doc in meals_cursor:
        meal_doc['_id'] = str(meal_doc['_id'])
        meal_doc['userId'] = str(meal_doc['userId'])
        meal_doc['date'] = meal_doc['date'].isoformat()
        meals_data.append(meal_doc)

    user_goals = {
        'tdee': user.get('tdee', 2000),
        'goal': user.get('goal', 'maintain'),
        'age': user.get('age'),
        'weight': user.get('weight'),
        'height': user.get('height'),
        'gender': user.get('gender'),
        'activityLevel': user.get('activityLevel'),
    }

    return jsonify({
        'meals': meals_data,
        'userGoals': user_goals,
        'range': range_type,
        'dateRange': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat(),
        },
    }), 200
