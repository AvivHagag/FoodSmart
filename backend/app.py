import os
import certifi
from flask import Flask
from dotenv import load_dotenv
from extensions import mongo, bcrypt, jwt
from routes.register import register_bp
from routes.login import login_bp

load_dotenv()
app = Flask(__name__)

app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

mongo.init_app(app, tlsCAFile=certifi.where())
bcrypt.init_app(app)
jwt.init_app(app)

app.register_blueprint(register_bp)
app.register_blueprint(login_bp)

# # Routes
# @app.route('/')
# def home():
#     try:
#         mongo.cx.server_info()  # Check MongoDB connection
#         return {"message": "Connected to MongoDB"}
#     except Exception as e:
#         return {"error": f"MongoDB connection not established: {str(e)}"}, 500

# @app.route('/register', methods=['POST'])
# def register():
#     """
#     Register a new user.
#     - Request body: {"username": "string", "password": "string"}
#     """
#     data = request.get_json()
#     username = data.get('username')
#     password = data.get('password')

#     if not username or not password:
#         return jsonify({"error": "Username and password are required"}), 400

#     # Check if the user already exists
#     if mongo.db.users.find_one({"username": username}):
#         return jsonify({"error": "User already exists"}), 400

#     # Hash the password and save the user
#     hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
#     mongo.db.users.insert_one({"username": username, "password": hashed_password})

#     return jsonify({"message": "User registered successfully"}), 201

# @app.route('/login', methods=['POST'])


# @app.route('/add_user', methods=['POST'])
# def add_user():
#     """
#     Add a new user (admin functionality).
#     - Request body: {"username": "string", "password": "string"}
#     """
#     data = request.get_json()
#     username = data.get('username')
#     password = data.get('password')

#     if not username or not password:
#         return jsonify({"error": "Username and password are required"}), 400

#     # Check if the user already exists
#     if mongo.db.users.find_one({"username": username}):
#         return jsonify({"error": "User already exists"}), 400

#     # Hash the password and save the user
#     hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
#     mongo.db.users.insert_one({"username": username, "password": hashed_password})

#     return jsonify({"message": "User added successfully"}), 201

# if __name__ == "__main__":
#     app.run(debug=True)