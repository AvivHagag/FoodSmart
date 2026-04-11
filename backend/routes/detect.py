# import base64
# import json
# import re
# import logging
# from flask import Blueprint, request, jsonify, current_app
# from flask_jwt_extended import jwt_required
# from openai import OpenAIError
# import extensions

# detect_bp = Blueprint('detect_bp', __name__)

# ANALYZE_PROMPT = """You are a professional nutritionist and food vision expert analyzing a meal photo.

# For EACH distinct food item visible in this image, provide a JSON object with:
# - "label": the food name (string)
# - "confidence": how confident you are this food is present, 0 to 1 (number)
# - "estimated_grams": your best visual estimate of the total portion weight in grams (number)
# - "unit": "piece" if this is a naturally countable item (egg, apple, cookie, slice of pizza), "gram" for everything else (number)
# - "count": number of pieces if unit is "piece", null if unit is "gram" (number|null)
# - "piece_avg_weight": average weight of ONE piece in grams if unit is "piece", null if unit is "gram" (number|null)
# - "cal": kilocalories per 100g (number)
# - "protein": grams of protein per 100g (number)
# - "fat": grams of fat per 100g (number)
# - "carbohydrates": grams of carbohydrates per 100g (number)

# Important rules:
# - estimated_grams should reflect the ACTUAL VISUAL PORTION in the photo, not a generic average
# - For piece foods: estimated_grams = count * piece_avg_weight
# - All nutrition values (cal, protein, fat, carbohydrates) are ALWAYS per 100g
# - Return ONLY a valid JSON array. No markdown, no code fences, no extra text.

# Example output:
# [
#   {"label":"Grilled Chicken Breast","confidence":0.95,"estimated_grams":180,"unit":"gram","count":null,"piece_avg_weight":null,"cal":165,"protein":31,"fat":3.6,"carbohydrates":0},
#   {"label":"Egg","confidence":0.92,"estimated_grams":110,"unit":"piece","count":2,"piece_avg_weight":55,"cal":155,"protein":13,"fat":11,"carbohydrates":1.1}
# ]"""


# @detect_bp.route('/analyze', methods=['POST'])
# @jwt_required()
# def analyze():
#     """
#     Single AI vision call: detect food items, estimate portions, return full nutrition.
#     Replaces the old /detect + N x /food flow.
#     """
#     try:
#         if 'image' not in request.files:
#             return jsonify({"error": "No image provided"}), 400

#         image_data = request.files['image'].read()

#         if len(image_data) > 10 * 1024 * 1024:
#             return jsonify({"error": "Image too large (max 10MB)"}), 400

#         b64_image = base64.b64encode(image_data).decode('utf-8')

#         response = extensions.openai_client.chat.completions.create(
#             model="gpt-4.1-nano",
#             messages=[{
#                 "role": "user",
#                 "content": [
#                     {"type": "text", "text": ANALYZE_PROMPT},
#                     {"type": "image_url", "image_url": {
#                         "url": f"data:image/jpeg;base64,{b64_image}",
#                         "detail": "low"
#                     }}
#                 ]
#             }],
#             temperature=0,
#             max_tokens=1000,
#         )

#         content = response.choices[0].message.content.strip()
#         # Strip any accidental markdown fences
#         content = re.sub(r'^```(?:json)?\s*', '', content)
#         content = re.sub(r'\s*```$', '', content)
#         print("--------------------------------")
#         print(content)
#         print("--------------------------------")
#         try:
#             items = json.loads(content)
#         except json.JSONDecodeError as e:
#             return jsonify({"error": "AI response parse failed", "details": str(e), "raw": content}), 500

#         if not isinstance(items, list):
#             return jsonify({"error": "Expected a JSON array from AI"}), 500

#         # Ensure all required fields exist and types are sane
#         validated = []
#         for item in items:
#             if not isinstance(item, dict) or "label" not in item:
#                 continue
#             validated.append({
#                 "label": str(item.get("label", "Unknown")),
#                 "confidence": float(item.get("confidence", 0.8)),
#                 "estimated_grams": float(item.get("estimated_grams", 100)),
#                 "unit": item.get("unit", "gram"),
#                 "count": item.get("count"),
#                 "piece_avg_weight": item.get("piece_avg_weight"),
#                 "cal": float(item.get("cal", 0)),
#                 "protein": float(item.get("protein", 0)),
#                 "fat": float(item.get("fat", 0)),
#                 "carbohydrates": float(item.get("carbohydrates", 0)),
#             })
#         print(validated)
#         return jsonify(validated), 200

#     except OpenAIError as e:
#         current_app.logger.error("OpenAI API error in /analyze: %s", e)
#         return jsonify({"error": "OpenAI API error", "details": str(e)}), 500
#     except Exception as e:
#         current_app.logger.exception("Unexpected error in /analyze")
#         return jsonify({"error": "Internal server error", "details": str(e)}), 500


# @detect_bp.route('/detect', methods=['POST'])
# @jwt_required()
# def detect_legacy():
#     """Legacy alias — redirects to /analyze for backward compatibility."""
#     return analyze()
import base64
import json
import mimetypes
import re
from typing import Any, Dict, List, Optional

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from openai import OpenAIError

import extensions

detect_bp = Blueprint("detect_bp", __name__)

MAX_IMAGE_SIZE = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

ANALYZE_PROMPT = """You are analyzing a food photo for nutrition tracking.

Return ONLY a valid JSON array. No markdown, no code fences, no extra text.

Rules:
- Group identical visible foods into a single item unless they clearly have different nutrition or are different food types.
- Do not return duplicate entries for the same grouped food.
- Naturally countable foods MUST use unit="piece".
- Eggs MUST use unit="piece" unless scrambled, chopped, or mixed into another dish.
- Use the most specific visible label possible, such as "Fried Egg" instead of "Egg" when cooking style is visible.
- For unit="piece", count and piece_avg_weight must be numeric, and estimated_grams must equal count * piece_avg_weight.
- For unit="gram", count and piece_avg_weight must be null.
- estimated_grams must reflect the realistic visible edible portion only.
- Do not overestimate weight based on plate size, camera angle, or empty space.
- A single fried egg is usually about 45-65g edible portion.
- All nutrition values (cal, protein, fat, carbohydrates) are ALWAYS per 100g.

For each item return a JSON object with:
- label (string)
- confidence (number 0-1)
- estimated_grams (number)
- unit (string: "piece" or "gram")
- count (number or null)
- piece_avg_weight (number or null)
- cal (number)
- protein (number)
- fat (number)
- carbohydrates (number)

Example:
[
  {
    "label": "Fried Egg",
    "confidence": 0.98,
    "estimated_grams": 220,
    "unit": "piece",
    "count": 4,
    "piece_avg_weight": 55,
    "cal": 155,
    "protein": 13,
    "fat": 11,
    "carbohydrates": 1.1
  }
]
"""

KNOWN_PIECE_RULES = {
    "egg": {"min_piece_g": 40.0, "max_piece_g": 65.0, "default_piece_g": 55.0, "canonical_label": "Egg"},
    "fried egg": {"min_piece_g": 45.0, "max_piece_g": 65.0, "default_piece_g": 55.0, "canonical_label": "Fried Egg"},
    "boiled egg": {"min_piece_g": 40.0, "max_piece_g": 65.0, "default_piece_g": 50.0, "canonical_label": "Boiled Egg"},
}


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return default


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


def _normalize_label(label: str) -> str:
    return re.sub(r"\s+", " ", label.strip())


def _label_key(label: str) -> str:
    return _normalize_label(label).lower()


def _match_piece_rule(label: str) -> Optional[Dict[str, Any]]:
    key = _label_key(label)
    for candidate, rule in KNOWN_PIECE_RULES.items():
        if candidate in key or key in candidate:
            return rule
    return None


def _extract_text_content(response: Any) -> str:
    try:
        content = response.choices[0].message.content
    except (AttributeError, IndexError, TypeError) as exc:
        raise ValueError("Missing model response content") from exc

    if content is None:
        raise ValueError("Model returned empty content")

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text_parts.append(block.get("text", ""))
            elif hasattr(block, "type") and getattr(block, "type", None) == "text":
                text_parts.append(getattr(block, "text", ""))
        joined = "".join(text_parts).strip()
        if joined:
            return joined

    raise ValueError("Unsupported model response format")


def _strip_code_fences(text: str) -> str:
    text = re.sub(r"^\s*```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    return text.strip()


def _validate_image_upload():
    if "image" not in request.files:
        return None, jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]

    if not image_file.filename:
        return None, jsonify({"error": "Empty filename"}), 400

    mimetype = image_file.mimetype or mimetypes.guess_type(image_file.filename)[0]
    if mimetype not in ALLOWED_MIME_TYPES:
        return None, jsonify(
            {
                "error": "Unsupported image type",
                "allowed_types": sorted(ALLOWED_MIME_TYPES),
            }
        ), 400

    image_data = image_file.read()
    if not image_data:
        return None, jsonify({"error": "Empty image file"}), 400

    if len(image_data) > MAX_IMAGE_SIZE:
        return None, jsonify({"error": "Image too large (max 10MB)"}), 400

    return {"data": image_data, "mimetype": mimetype}, None, None


def _build_data_url(image_data: bytes, mimetype: str) -> str:
    b64_image = base64.b64encode(image_data).decode("utf-8")
    return f"data:{mimetype};base64,{b64_image}"


def _normalize_item(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(item, dict):
        return None

    raw_label = str(item.get("label", "")).strip()
    label = _normalize_label(raw_label)
    if not label:
        return None

    unit = str(item.get("unit", "gram")).strip().lower()
    if unit not in {"gram", "piece"}:
        unit = "gram"

    confidence = _clamp(_safe_float(item.get("confidence"), 0.0), 0.0, 1.0)
    estimated_grams = max(0.0, _safe_float(item.get("estimated_grams"), 0.0))

    count = item.get("count")
    piece_avg_weight = item.get("piece_avg_weight")

    piece_rule = _match_piece_rule(label)

    if piece_rule:
        unit = "piece"
        label = piece_rule["canonical_label"]

    if unit == "piece":
        count = max(1, _safe_int(count, 1))
        piece_avg_weight = max(0.0, _safe_float(piece_avg_weight, 0.0))

        if piece_rule:
            if piece_avg_weight <= 0:
                piece_avg_weight = piece_rule["default_piece_g"]
            piece_avg_weight = _clamp(
                piece_avg_weight,
                piece_rule["min_piece_g"],
                piece_rule["max_piece_g"],
            )

        if estimated_grams <= 0:
            estimated_grams = count * piece_avg_weight
        else:
            if piece_avg_weight <= 0 and count > 0:
                piece_avg_weight = estimated_grams / count

            if piece_rule:
                piece_avg_weight = _clamp(
                    piece_avg_weight,
                    piece_rule["min_piece_g"],
                    piece_rule["max_piece_g"],
                )

            estimated_grams = count * piece_avg_weight
    else:
        count = None
        piece_avg_weight = None

    return {
        "label": label,
        "confidence": confidence,
        "estimated_grams": round(estimated_grams, 1),
        "unit": unit,
        "count": count,
        "piece_avg_weight": round(piece_avg_weight, 1) if piece_avg_weight is not None else None,
        "cal": max(0.0, _safe_float(item.get("cal"), 0.0)),
        "protein": max(0.0, _safe_float(item.get("protein"), 0.0)),
        "fat": max(0.0, _safe_float(item.get("fat"), 0.0)),
        "carbohydrates": max(0.0, _safe_float(item.get("carbohydrates"), 0.0)),
    }


def _merge_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grouped: Dict[str, Dict[str, Any]] = {}

    for item in items:
        key = f'{_label_key(item["label"])}::{item["unit"]}'
        if key not in grouped:
            grouped[key] = item.copy()
            continue

        existing = grouped[key]

        existing["confidence"] = max(existing["confidence"], item["confidence"])

        if existing["unit"] == "piece":
            existing_count = existing.get("count") or 0
            new_count = item.get("count") or 0
            total_count = existing_count + new_count

            existing_grams = existing.get("estimated_grams", 0.0)
            new_grams = item.get("estimated_grams", 0.0)
            total_grams = existing_grams + new_grams

            existing["count"] = total_count
            existing["estimated_grams"] = round(total_grams, 1)
            existing["piece_avg_weight"] = round(total_grams / total_count, 1) if total_count > 0 else None
        else:
            existing["estimated_grams"] = round(
                existing.get("estimated_grams", 0.0) + item.get("estimated_grams", 0.0),
                1,
            )

    return list(grouped.values())


def _apply_sanity_rules(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    corrected: List[Dict[str, Any]] = []

    for item in items:
        label = item["label"]
        rule = _match_piece_rule(label)

        if rule and item["unit"] == "piece":
            count = max(1, _safe_int(item.get("count"), 1))
            piece_avg_weight = _safe_float(item.get("piece_avg_weight"), rule["default_piece_g"])
            piece_avg_weight = _clamp(
                piece_avg_weight,
                rule["min_piece_g"],
                rule["max_piece_g"],
            )
            item["label"] = rule["canonical_label"]
            item["count"] = count
            item["piece_avg_weight"] = round(piece_avg_weight, 1)
            item["estimated_grams"] = round(count * piece_avg_weight, 1)

        corrected.append(item)

    return corrected


def _parse_and_validate_items(raw_content: str) -> List[Dict[str, Any]]:
    cleaned = _strip_code_fences(raw_content)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(f"AI response parse failed: {exc}") from exc

    if not isinstance(parsed, list):
        raise ValueError("Expected a JSON array from AI")

    validated: List[Dict[str, Any]] = []
    for item in parsed:
        normalized = _normalize_item(item)
        if normalized:
            validated.append(normalized)

    merged = _merge_items(validated)
    corrected = _apply_sanity_rules(merged)

    return corrected


def _analyze_image(image_data: bytes, mimetype: str) -> List[Dict[str, Any]]:
    data_url = _build_data_url(image_data, mimetype)

    response = extensions.openai_client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": ANALYZE_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": data_url,
                            "detail": "low",
                        },
                    },
                ],
            }
        ],
        temperature=0,
        max_tokens=1000,
    )

    content = _extract_text_content(response)
    current_app.logger.debug("Raw AI analyze response: %s", content)

    items = _parse_and_validate_items(content)
    current_app.logger.debug("Validated analyze items: %s", items)

    return items


@detect_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze():
    try:
        upload, error_response, status_code = _validate_image_upload()
        if error_response:
            return error_response, status_code

        items = _analyze_image(upload["data"], upload["mimetype"])
        return jsonify(items), 200

    except ValueError as exc:
        current_app.logger.warning("Validation/parsing error in /analyze: %s", exc)
        return jsonify({"error": str(exc)}), 500

    except OpenAIError as exc:
        current_app.logger.error("OpenAI API error in /analyze: %s", exc)
        return jsonify({"error": "OpenAI API error"}), 502

    except Exception:
        current_app.logger.exception("Unexpected error in /analyze")
        return jsonify({"error": "Internal server error"}), 500


@detect_bp.route("/detect", methods=["POST"])
@jwt_required()
def detect_legacy():
    return analyze()