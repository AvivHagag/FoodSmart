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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
