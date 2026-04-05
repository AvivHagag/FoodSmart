from datetime import timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from extensions import mongo, bcrypt

login_bp = Blueprint('login_bp', __name__)


@login_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email') if data else None
        password = data.get('password') if data else None

        if not email or not password:
            return jsonify({"error": "email and password are required"}), 400

        email = email.lower()
        user = mongo.db.users.find_one({"email": email})

        if not user or not bcrypt.check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid username or password"}), 401

        user_id = str(user['_id'])
        user.pop('password', None)
        user['_id'] = user_id

        # Identity is the user's MongoDB _id string — used by @jwt_required routes
        access_token = create_access_token(
            identity=user_id,
            expires_delta=timedelta(days=30),
        )

        return jsonify({"token": access_token, "user": user}), 200
    except ServerSelectionTimeoutError:
        return jsonify({
            "error": "Database is unreachable. Check MongoDB Atlas network access and MONGO_URI."
        }), 503
    except PyMongoError:
        return jsonify({"error": "Database error during login"}), 500
