from flask import Blueprint, jsonify
from extensions import mongo
from bson import ObjectId

get_user_bp = Blueprint('get_user', __name__)

@get_user_bp.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user_object_id = ObjectId(user_id)
    except:
        return jsonify({'message': 'Invalid user ID format.'}), 400

    user = mongo.db.users.find_one({"_id": user_object_id})
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    if 'password' in user:
        user.pop('password', None)
    user['_id'] = str(user['_id'])
    
    return jsonify({'user': user}), 200 