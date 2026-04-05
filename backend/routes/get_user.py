from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from extensions import mongo
from bson import ObjectId
from routes.auth_helpers import require_own_user

get_user_bp = Blueprint('get_user', __name__)


@get_user_bp.route('/api/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    err, code = require_own_user(user_id)
    if err:
        return err, code

    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return jsonify({'message': 'Invalid user ID format.'}), 400

    user = mongo.db.users.find_one({"_id": user_object_id})
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    user.pop('password', None)
    user['_id'] = str(user['_id'])

    return jsonify({'user': user}), 200
