from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
import datetime

get_meals_bp = Blueprint('get_meals', __name__)

@get_meals_bp.route('/api/user/<user_id>/meals', methods=['GET'])
def get_user_meals(user_id):
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'message': 'Missing required query param: date (ISO format YYYY-MM-DD)'}), 400
    try:
        parsed = datetime.datetime.fromisoformat(date_str)
        start = datetime.datetime(parsed.year, parsed.month, parsed.day, tzinfo=datetime.timezone.utc)
        end   = start + datetime.timedelta(days=1)
    except Exception:
        return jsonify({'message': 'Invalid date format. Use ISO format YYYY-MM-DD'}), 400

    try:
        uid = ObjectId(user_id)
    except Exception:
        return jsonify({'message': 'Invalid user ID format.'}), 400

    cursor = mongo.db.meals.find({
        'userId': uid,
        'date':   {'$gte': start, '$lt': end}
    })
    meals = []
    for m in cursor:
        m['_id']      = str(m['_id'])
        m['userId']   = str(m['userId'])
        meals.append(m)
    return jsonify({'meals': meals}), 200