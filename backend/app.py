import os
import sys
from pathlib import Path
from datetime import timedelta

import certifi
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo.errors import ConfigurationError, ServerSelectionTimeoutError

# Load .env from repo root when running from backend/ (e.g. `python app.py`)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

from extensions import mongo, bcrypt, jwt, init_openai
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
from routes.update_basic_info import update_basic_info_bp
from routes.delete_meal import delete_meal_bp
from routes.update_meal import update_meal_bp
from routes.support_message import support_message_bp
from routes.statistics import statistics_bp
from routes.ai_nutrition_advisor import ai_nutrition_advisor_bp

app = Flask(__name__)

CORS(app)

app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

if not app.config["MONGO_URI"]:
    print(
        "MONGO_URI is not set. Add it to .env at the project root, or export it.",
        file=sys.stderr,
    )
    sys.exit(1)

if not app.config["JWT_SECRET_KEY"]:
    print("JWT_SECRET_KEY is not set.", file=sys.stderr)
    sys.exit(1)

try:
    mongo.init_app(
        app,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000,
    )
except ConfigurationError as e:
    print(
        "MongoDB configuration failed:\n"
        f"  {e}\n"
        "If the hostname does not resolve, your Atlas cluster may have been removed or renamed.\n"
        "In MongoDB Atlas: Database → Connect → Drivers → copy the current connection string,\n"
        "then update MONGO_URI in .env. For local MongoDB use:\n"
        "  mongodb://127.0.0.1:27017/your_db_name",
        file=sys.stderr,
    )
    sys.exit(1)
except Exception as e:
    print(f"MongoDB client initialization failed: {e}", file=sys.stderr)
    sys.exit(1)

try:
    mongo.cx.admin.command("ping")
except ServerSelectionTimeoutError as e:
    print(
        "MongoDB is unreachable.\n"
        f"  {e}\n"
        "The Atlas hostnames resolve, but the database servers are timing out.\n"
        "This is usually caused by MongoDB Atlas network access rules, a paused/deleted cluster,\n"
        "or a firewall/VPN blocking outbound connections to port 27017.\n"
        "In MongoDB Atlas:\n"
        "  1. Check that the cluster is running.\n"
        "  2. Go to Network Access and allow your current public IP.\n"
        "  3. If your IP changes often, temporarily allow 0.0.0.0/0 for development.\n"
        "  4. Verify the connection string in MONGO_URI is current.\n"
        "For local MongoDB use:\n"
        "  mongodb://127.0.0.1:27017/your_db_name",
        file=sys.stderr,
    )
    sys.exit(1)

bcrypt.init_app(app)
jwt.init_app(app)
init_openai()

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
app.register_blueprint(update_basic_info_bp)
app.register_blueprint(delete_meal_bp)
app.register_blueprint(update_meal_bp)
app.register_blueprint(support_message_bp)
app.register_blueprint(statistics_bp)
app.register_blueprint(ai_nutrition_advisor_bp)

if __name__ == '__main__':
    # Development only — use `gunicorn -w 4 -b 0.0.0.0:5002 app:app` in production
    app.run(debug=False, host='0.0.0.0', port=5002)
