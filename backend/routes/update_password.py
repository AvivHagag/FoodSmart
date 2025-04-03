from flask import Blueprint, request, jsonify
from extensions import mongo, bcrypt
from bson import ObjectId

update_password_bp = Blueprint('update_password', __name__)

@update_password_bp.route('/api/update_password', methods=['PUT'])
def update_password():
    data = request.get_json()
    if not data or 'currentPassword' not in data or 'newPassword' not in data or 'userID' not in data:
        return jsonify({'message': 'Current password, new password, and userID are required.'}), 400

    try:
        user_id = ObjectId(data['userID'])
    except:
        return jsonify({'message': 'Invalid user ID format.'}), 400

    current_password = data['currentPassword']
    new_password = data['newPassword']

    user = mongo.db.users.find_one({'_id': user_id})
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    if not bcrypt.check_password_hash(user['password'], current_password):
        return jsonify({'message': 'Current password is incorrect.'}), 400

    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')

    result = mongo.db.users.update_one(
        {'_id': user_id},
        {'$set': {'password': hashed_password}}
    )

    if result.modified_count:
        return jsonify({'message': 'Password updated successfully.'}), 200
    else:
        return jsonify({'message': 'No changes made or an error occurred.'}), 400
