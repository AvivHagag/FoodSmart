import base64
import json
import re
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from openai import OpenAIError
import extensions

detect_bp = Blueprint('detect_bp', __name__)

ANALYZE_PROMPT = """You are a professional nutritionist and food vision expert analyzing a meal photo.

For EACH distinct food item visible in this image, provide a JSON object with:
- "label": the food name (string)
- "confidence": how confident you are this food is present, 0 to 1 (number)
- "estimated_grams": your best visual estimate of the total portion weight in grams (number)
- "unit": "piece" if this is a naturally countable item (egg, apple, cookie, slice of pizza), "gram" for everything else (number)
- "count": number of pieces if unit is "piece", null if unit is "gram" (number|null)
- "piece_avg_weight": average weight of ONE piece in grams if unit is "piece", null if unit is "gram" (number|null)
- "cal": kilocalories per 100g (number)
- "protein": grams of protein per 100g (number)
- "fat": grams of fat per 100g (number)
- "carbohydrates": grams of carbohydrates per 100g (number)

Important rules:
- estimated_grams should reflect the ACTUAL VISUAL PORTION in the photo, not a generic average
- For piece foods: estimated_grams = count * piece_avg_weight
- All nutrition values (cal, protein, fat, carbohydrates) are ALWAYS per 100g
- Return ONLY a valid JSON array. No markdown, no code fences, no extra text.

Example output:
[
  {"label":"Grilled Chicken Breast","confidence":0.95,"estimated_grams":180,"unit":"gram","count":null,"piece_avg_weight":null,"cal":165,"protein":31,"fat":3.6,"carbohydrates":0},
  {"label":"Egg","confidence":0.92,"estimated_grams":110,"unit":"piece","count":2,"piece_avg_weight":55,"cal":155,"protein":13,"fat":11,"carbohydrates":1.1}
]"""


@detect_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze():
    """
    Single AI vision call: detect food items, estimate portions, return full nutrition.
    Replaces the old /detect + N x /food flow.
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400

        image_data = request.files['image'].read()

        if len(image_data) > 10 * 1024 * 1024:
            return jsonify({"error": "Image too large (max 10MB)"}), 400

        b64_image = base64.b64encode(image_data).decode('utf-8')

        response = extensions.openai_client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": ANALYZE_PROMPT},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{b64_image}",
                        "detail": "low"
                    }}
                ]
            }],
            temperature=0,
            max_tokens=1000,
        )

        content = response.choices[0].message.content.strip()
        # Strip any accidental markdown fences
        content = re.sub(r'^```(?:json)?\s*', '', content)
        content = re.sub(r'\s*```$', '', content)

        try:
            items = json.loads(content)
        except json.JSONDecodeError as e:
            return jsonify({"error": "AI response parse failed", "details": str(e), "raw": content}), 500

        if not isinstance(items, list):
            return jsonify({"error": "Expected a JSON array from AI"}), 500

        # Ensure all required fields exist and types are sane
        validated = []
        for item in items:
            if not isinstance(item, dict) or "label" not in item:
                continue
            validated.append({
                "label": str(item.get("label", "Unknown")),
                "confidence": float(item.get("confidence", 0.8)),
                "estimated_grams": float(item.get("estimated_grams", 100)),
                "unit": item.get("unit", "gram"),
                "count": item.get("count"),
                "piece_avg_weight": item.get("piece_avg_weight"),
                "cal": float(item.get("cal", 0)),
                "protein": float(item.get("protein", 0)),
                "fat": float(item.get("fat", 0)),
                "carbohydrates": float(item.get("carbohydrates", 0)),
            })

        return jsonify(validated), 200

    except OpenAIError as e:
        current_app.logger.error("OpenAI API error in /analyze: %s", e)
        return jsonify({"error": "OpenAI API error", "details": str(e)}), 500
    except Exception as e:
        current_app.logger.exception("Unexpected error in /analyze")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@detect_bp.route('/detect', methods=['POST'])
@jwt_required()
def detect_legacy():
    """Legacy alias — redirects to /analyze for backward compatibility."""
    return analyze()
