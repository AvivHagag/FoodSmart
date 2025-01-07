from flask import Blueprint, jsonify, request
from extensions import mongo, bcrypt
from datetime import datetime
from pymongo.errors import DuplicateKeyError

register_bp = Blueprint('register_bp', __name__)

@register_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    fullname = data.get('fullname')
    email = data.get('email')
    password = data.get('password')

    if not email or not fullname or not password:
        return jsonify({"error": "fullname, email, and password are required"}), 400

    email = email.lower()

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user = {
        "email": email,
        "fullname": fullname,
        "password": hashed_password,
        "createdAt": datetime.utcnow(),  
        "age": None,                    
        "weight": None,                 
        "height": None,                 
        "image": None,                  
        "gender": None                  
    }

    try:
        mongo.db.users.insert_one(new_user)
    except DuplicateKeyError as e:
        if 'email' in str(e):
            return jsonify({"error": "Email already exists"}), 409
        else:
            return jsonify({"error": "A duplicate key error occurred"}), 409

    return jsonify({"message": "User created successfully"}), 201