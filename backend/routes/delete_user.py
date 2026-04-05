from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from extensions import mongo

delete_user_bp = Blueprint("delete_user_bp", __name__)


@delete_user_bp.route("/api/delete_user", methods=["DELETE"])
@jwt_required()
def delete_user():
    data = request.get_json()
    if not data or "userID" not in data:
        return jsonify({"message": "User ID is required."}), 400

    current_user_id = get_jwt_identity()
    if data["userID"] != current_user_id:
        return jsonify({"message": "Forbidden"}), 403

    try:
        result = mongo.db.users.delete_one({"_id": ObjectId(data["userID"])})
        if result.deleted_count == 1:
            return jsonify({"message": "User deleted successfully."}), 200
        return jsonify({"message": "User not found."}), 404
    except Exception as e:
        return jsonify({"message": f"Server error: {e}"}), 500
