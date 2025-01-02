from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from extensions import mongo, bcrypt

login_bp = Blueprint('login_bp', __name__)

@login_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400
    email = email.lower()
    user = mongo.db.users.find_one({"email": email})
    if not user or not bcrypt.check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid username or password"}), 401

    access_token = create_access_token(identity={"email": email})
    return jsonify({"token": access_token}), 200