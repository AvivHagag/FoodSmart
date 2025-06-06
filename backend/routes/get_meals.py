from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
import datetime

get_meals_bp = Blueprint('get_meals', __name__, url_prefix='/api/user')

def _parse_date_only(date_str: str) -> datetime.date:
    ds = date_str.replace('Z', '+00:00')
    dt = datetime.datetime.fromisoformat(ds)
    return dt.date()

@get_meals_bp.route('/<user_id>/get_meals', methods=['GET'])
def get_user_meals(user_id):
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'message': 'Missing required query param: date (ISO format YYYY-MM-DD)'}), 400
    try:
        day_only = _parse_date_only(date_str)
    except Exception:
        return (
            jsonify({
                'message': 'Invalid date format. '
                           'Use ISO format YYYY-MM-DD or full ISO datetime'
            }),
            400,
        )
    start = datetime.datetime(day_only.year, day_only.month, day_only.day)
    end   = start + datetime.timedelta(days=1)

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