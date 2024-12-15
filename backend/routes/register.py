from flask import Blueprint, jsonify, request
from extensions import mongo, bcrypt

register_bp = Blueprint('register_bp', __name__)

@register_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Check if user already exists
    existing_user = mongo.db.users.find_one({"username": username})
    if existing_user:
        return jsonify({"error": "User already exists"}), 409

    # Hash the user's password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create the user
    new_user = {
        "username": username,
        "password": hashed_password
    }
    mongo.db.users.insert_one(new_user)

    return jsonify({"message": "User created successfully"}), 201