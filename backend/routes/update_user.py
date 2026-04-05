from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import mongo
from bson import ObjectId

update_user_bp = Blueprint('update_user', __name__)


@update_user_bp.route('/api/update_user', methods=['PUT'])
@jwt_required()
def update_user():
    data = request.get_json()
    if not data or '_id' not in data:
        return jsonify({'message': 'User ID is required.'}), 400

    try:
        user_id = ObjectId(data['_id'])
    except Exception:
        return jsonify({'message': 'Invalid user ID format.'}), 400

    update_fields = {}
    for field in ['age', 'weight', 'height', 'gender', 'activityLevel', 'goal', 'bmi', 'tdee']:
        if field in data:
            update_fields[field] = data[field]

    user = mongo.db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    result = mongo.db.users.update_one({"_id": user_id}, {"$set": update_fields})
    if result.modified_count:
        return jsonify({'message': 'User updated successfully.'}), 200
    return jsonify({'message': 'No changes were made to the user record.'}), 200
