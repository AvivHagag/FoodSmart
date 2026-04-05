from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo, bcrypt
from bson import ObjectId

update_password_bp = Blueprint('update_password', __name__)


@update_password_bp.route('/api/update_password', methods=['PUT'])
@jwt_required()
def update_password():
    data = request.get_json()
    if not data or 'currentPassword' not in data or 'newPassword' not in data or 'userID' not in data:
        return jsonify({'message': 'currentPassword, newPassword, and userID are required.'}), 400

    current_user_id = get_jwt_identity()
    if data['userID'] != current_user_id:
        return jsonify({'message': 'Forbidden'}), 403

    try:
        user_id = ObjectId(data['userID'])
    except Exception:
        return jsonify({'message': 'Invalid user ID format.'}), 400

    user = mongo.db.users.find_one({'_id': user_id})
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    if not bcrypt.check_password_hash(user['password'], data['currentPassword']):
        return jsonify({'message': 'Current password is incorrect.'}), 400

    hashed = bcrypt.generate_password_hash(data['newPassword']).decode('utf-8')
    result = mongo.db.users.update_one({'_id': user_id}, {'$set': {'password': hashed}})

    if result.modified_count:
        return jsonify({'message': 'Password updated successfully.'}), 200
    return jsonify({'message': 'No changes made or an error occurred.'}), 400
