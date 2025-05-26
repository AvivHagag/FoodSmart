from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
from datetime import datetime, timedelta

statistics_bp = Blueprint('statistics', __name__, url_prefix='/api/statistics')

def get_date_range(range_type):
    """Get start and end dates for the specified range"""
    end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
    
    if range_type == "Week":
        # Get today and 6 days before (7 days total)
        start_date = end_date - timedelta(days=6)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range_type == "30 Days":
        # Get today and 29 days before (30 days total)
        start_date = end_date - timedelta(days=29)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range_type == "60 Days":
        # Get today and 59 days before (60 days total)
        start_date = end_date - timedelta(days=59)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range_type == "90 Days":
        # Get today and 89 days before (90 days total)
        start_date = end_date - timedelta(days=89)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        # Default to week
        start_date = end_date - timedelta(days=6)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    return start_date, end_date

@statistics_bp.route('/<user_id>', methods=['GET'])
def get_user_meals_and_goals(user_id):
    """Get all user meals and goals for statistics calculation on client side"""
    range_type = request.args.get('range', 'Week')
    
    try:
        user_oid = ObjectId(user_id)
    except:
        return jsonify({'error': 'Invalid user ID format'}), 400
    
    # Get user data
    user = mongo.db.users.find_one({"_id": user_oid})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Calculate date range
    start_date, end_date = get_date_range(range_type)
    
    # Fetch meals within the date range
    meals_cursor = mongo.db.meals.find({
        'userId': user_oid,
        'date': {'$gte': start_date, '$lte': end_date}
    }).sort('date', 1)
    
    meals_data = []
    for meal_doc in meals_cursor:
        meal_doc['_id'] = str(meal_doc['_id'])
        meal_doc['userId'] = str(meal_doc['userId'])
        meal_doc['date'] = meal_doc['date'].isoformat()
        meals_data.append(meal_doc)
    
    # Prepare user goals data
    user_goals = {
        'tdee': user.get('tdee', 2000),
        'goal': user.get('goal', 'maintain'),
        'age': user.get('age'),
        'weight': user.get('weight'),
        'height': user.get('height'),
        'gender': user.get('gender'),
        'activityLevel': user.get('activityLevel')
    }
    
    # Prepare response
    response_data = {
        'meals': meals_data,
        'userGoals': user_goals,
        'range': range_type,
        'dateRange': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        }
    }
    
    return jsonify(response_data), 200