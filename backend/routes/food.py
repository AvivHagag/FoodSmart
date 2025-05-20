import os
import json
from flask import Blueprint, request, jsonify
from openai import OpenAI              
from extensions import mongo
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables.")
    print("You need to create a .env file in the backend directory with your OpenAI API key:")
    print("OPENAI_API_KEY=your_api_key_here")
    api_key = input("Enter your OpenAI API key to continue: ")

client = OpenAI(api_key=api_key)

food_bp = Blueprint("food_bp", __name__, url_prefix="/food")

@food_bp.route("", methods=["POST"])
def get_or_create_food():
    data = request.get_json()
    name = data.get("name")
    if not name:
        return jsonify({"error": "Missing 'name' parameter"}), 400

    existing = mongo.db.foods.find_one({"name": name})
    if existing:
        existing.pop("_id", None)
        return jsonify(existing), 200

    prompt = f"""
    You are a registered nutritionist. Given the food name "{name}", provide its nutritional values **normalized to 100 g** (ignore other serving sizes; scaling is done in the frontend).  
    – Only output a single, valid JSON object (no markdown, no code fences, no extra text).  
    – Use this exact schema and key order:

    {{
    "name": "<string: the food name>",
    "unit": "<\"piece\" or \"gram\">",
     "piece_avg_weight": <number|null: grams in one piece; null if unit is \"gram\">,
  "avg_gram": <number|null: typical serving size in grams; null if unit is \"piece\">,
    "cal": <number: kcal per 100 g>,
    "protein": <number: g protein per 100 g>,
    "fat": <number: g fat per 100 g>,
    "carbohydrates": <number: g carbs per 100 g>
    }}
    """
    try:
        chat_resp = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=300
        )
        content = chat_resp.choices[0].message.content.strip()
        nutrition = json.loads(content)
    except Exception as e:
        return jsonify({"error": f"Failed to get/parse nutrition: {e}"}), 500

    mongo.db.foods.insert_one(nutrition)
    nutrition.pop("_id",None)
    return jsonify(nutrition), 201
