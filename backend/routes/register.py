from flask import Blueprint, jsonify, request
from extensions import mongo, bcrypt
from datetime import datetime
from pymongo.errors import DuplicateKeyError, PyMongoError, ServerSelectionTimeoutError

register_bp = Blueprint('register_bp', __name__)

@register_bp.route('/register', methods=['POST'])
def register():
    try:
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

        mongo.db.users.insert_one(new_user)
    except DuplicateKeyError as e:
        if 'email' in str(e):
            return jsonify({"error": "Email already exists"}), 409
        else:
            return jsonify({"error": "A duplicate key error occurred"}), 409
    except ServerSelectionTimeoutError:
        return jsonify({
            "error": "Database is unreachable. Check MongoDB Atlas network access and MONGO_URI."
        }), 503
    except PyMongoError:
        return jsonify({"error": "Database error during registration"}), 500

    return jsonify({"message": "User created successfully"}), 201