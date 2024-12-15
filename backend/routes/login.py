from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from extensions import mongo, bcrypt

login_bp = Blueprint('login_bp', __name__)

@login_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = mongo.db.users.find_one({"username": username})
    if not user or not bcrypt.check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid username or password"}), 401

    access_token = create_access_token(identity={"username": username})
    return jsonify({"token": access_token}), 200