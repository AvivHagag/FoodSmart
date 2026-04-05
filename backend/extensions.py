import os
import certifi
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from openai import OpenAI

mongo = PyMongo()
bcrypt = Bcrypt()
jwt = JWTManager()

# Shared OpenAI client — imported by all route files
openai_client: OpenAI = None  # type: ignore


def init_openai():
    """Call once from app.py after load_dotenv so the key is available."""
    global openai_client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to the .env file at the project root."
        )
    openai_client = OpenAI(api_key=api_key)
