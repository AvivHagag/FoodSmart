import os
import certifi
from flask import Flask
from dotenv import load_dotenv
from extensions import mongo, bcrypt, jwt
from routes.register import register_bp
from routes.login import login_bp
from routes.detect import detect_bp
from routes.update_user import update_user_bp
from routes.update_password import update_password_bp
from routes.delete_user import delete_user_bp
from routes.get_user import get_user_bp
from routes.get_meals import get_meals_bp
from routes.food import food_bp     
from routes.meals import meals_bp

load_dotenv()
app = Flask(__name__)

app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

mongo.init_app(app, tlsCAFile=certifi.where())
bcrypt.init_app(app)
jwt.init_app(app)

app.register_blueprint(register_bp)
app.register_blueprint(login_bp)
app.register_blueprint(detect_bp)
app.register_blueprint(update_user_bp)
app.register_blueprint(update_password_bp)
app.register_blueprint(delete_user_bp)
app.register_blueprint(get_user_bp)
app.register_blueprint(food_bp)
app.register_blueprint(get_meals_bp)
app.register_blueprint(meals_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
