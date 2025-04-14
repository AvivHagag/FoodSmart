from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from extensions import mongo

delete_user_bp = Blueprint("delete_user_bp", __name__)

@delete_user_bp.route("/api/delete_user", methods=["DELETE"])
def delete_user():
    data = request.get_json()
    if not data or "userID" not in data:
        return jsonify({"message": "User ID is required."}), 400
    
    user_id = data["userID"]

    try:
        result = mongo.db.users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 1:
            return jsonify({"message": "User deleted successfully."}), 200
        else:
            return jsonify({"message": "User not found."}), 404
    except Exception as e:
        return jsonify({"message": "Server error: " + str(e)}), 500
