import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import mongo
import extensions

food_bp = Blueprint("food_bp", __name__, url_prefix="/food")


@food_bp.route("", methods=["POST"])
@jwt_required()
def get_or_create_food():
    """
    Manual food nutrition lookup (no longer called from the camera flow;
    the /analyze endpoint now returns nutrition directly from the photo).
    Kept for potential future use (e.g. manual food search).
    """
    data = request.get_json()
    name = data.get("name") if data else None
    if not name:
        return jsonify({"error": "Missing 'name' parameter"}), 400

    prompt = f"""You are a registered nutritionist. Given the food name "{name}", provide its nutritional values normalized to 100g.

- For discrete countable foods (eggs, apples, cookies, pizza slices): set "unit" to "piece", "piece_avg_weight" to grams per piece, "avg_gram" to null
- For continuous foods (rice, meat, liquids): set "unit" to "gram", "piece_avg_weight" to null, "avg_gram" to a typical serving size in grams

Return ONLY a single valid JSON object (no markdown, no fences):
{{
  "name": "<food name>",
  "unit": "<piece or gram>",
  "piece_avg_weight": <number|null>,
  "avg_gram": <number|null>,
  "cal": <kcal per 100g>,
  "protein": <g per 100g>,
  "fat": <g per 100g>,
  "carbohydrates": <g per 100g>
}}"""

    try:
        resp = extensions.openai_client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=300,
        )
        content = resp.choices[0].message.content.strip()
        nutrition = json.loads(content)
    except Exception as e:
        return jsonify({"error": f"Failed to get/parse nutrition: {e}"}), 500

    return jsonify(nutrition), 200
