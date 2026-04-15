from __future__ import annotations

import json
import logging
import re
from typing import Any

from openai import OpenAIError

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.integrations.openai_client import get_openai_client
from app.utils.images import build_data_url


logger = logging.getLogger(__name__)

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

SECOND_PASS_PROMPT = ANALYZE_PROMPT

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


def _normalize_label(label: str) -> str:
    return re.sub(r"\s+", " ", label.strip())


def _label_key(label: str) -> str:
    return _normalize_label(label).lower()


def _match_piece_rule(label: str):
    key = _label_key(label)
    for candidate, rule in KNOWN_PIECE_RULES.items():
        if candidate in key or key in candidate:
            return rule
    return None


def _normalize_item(item: dict[str, Any]) -> dict[str, Any] | None:
    raw_label = str(item.get("label", "")).strip()
    label = _normalize_label(raw_label)
    if not label:
        return None

    unit = str(item.get("unit", "gram")).strip().lower()
    if unit not in {"gram", "piece"}:
        unit = "gram"

    confidence = min(max(_safe_float(item.get("confidence"), 0.0), 0.0), 1.0)
    estimated_grams = max(0.0, _safe_float(item.get("estimated_grams"), 0.0))
    count = item.get("count")
    piece_avg_weight = item.get("piece_avg_weight")

    rule = _match_piece_rule(label)
    if rule:
        unit = "piece"
        label = rule["canonical_label"]

    if unit == "piece":
        count = max(1, _safe_int(count, 1))
        piece_avg_weight = max(0.0, _safe_float(piece_avg_weight, 0.0))
        if rule:
            if piece_avg_weight <= 0:
                piece_avg_weight = rule["default_piece_g"]
            piece_avg_weight = min(
                max(piece_avg_weight, rule["min_piece_g"]),
                rule["max_piece_g"],
            )
        if estimated_grams <= 0:
            estimated_grams = count * piece_avg_weight
        else:
            if piece_avg_weight <= 0 and count > 0:
                piece_avg_weight = estimated_grams / count
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


def _merge_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
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
            total_grams = existing.get("estimated_grams", 0.0) + item.get("estimated_grams", 0.0)
            existing["count"] = total_count
            existing["estimated_grams"] = round(total_grams, 1)
            existing["piece_avg_weight"] = round(total_grams / total_count, 1) if total_count > 0 else None
        else:
            existing["estimated_grams"] = round(
                existing.get("estimated_grams", 0.0) + item.get("estimated_grams", 0.0),
                1,
            )
    return list(grouped.values())


def _extract_response_text(response: Any) -> str:
    content = response.choices[0].message.content
    if isinstance(content, list):
        text = "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        )
    else:
        text = str(content or "")
    text = re.sub(r"^\s*```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text).strip()
    return text


def _parse_detection_payload(text: str) -> list[dict[str, Any]]:
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AppException(500, "AI response parse failed", "ai_parse_failed") from exc

    if not isinstance(parsed, list):
        raise AppException(500, "Expected a JSON array from AI", "ai_invalid_format")

    normalized = [_normalize_item(item) for item in parsed if isinstance(item, dict)]
    return _merge_items([item for item in normalized if item])


def _truncate_for_log(text: str, limit: int = 600) -> str:
    if len(text) <= limit:
        return text
    return f"{text[:limit]}...<truncated>"


def analyze_food_image(image_data: bytes, mime_type: str) -> list[dict[str, Any]]:
    client = get_openai_client()
    settings = get_settings()
    prompts = [ANALYZE_PROMPT, SECOND_PASS_PROMPT]
    last_error: AppException | None = None

    for attempt, prompt in enumerate(prompts, start=1):
        try:
            response = client.chat.completions.create(
                model=settings.openai_detection_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": build_data_url(image_data, mime_type),
                                    "detail": "high",
                                },
                            },
                        ],
                    }
                ],
                temperature=0,
                max_tokens=1200,
            )
        except OpenAIError as exc:
            raise AppException(502, "OpenAI API error", "openai_error") from exc

        text = _extract_response_text(response)
        logger.info(
            "Detection attempt=%s model=%s mime_type=%s image_bytes=%s raw_response=%s",
            attempt,
            settings.openai_detection_model,
            mime_type,
            len(image_data),
            _truncate_for_log(text),
        )

        try:
            merged = _parse_detection_payload(text)
        except AppException as exc:
            last_error = exc
            logger.warning(
                "Detection parse issue on attempt=%s code=%s detail=%s",
                attempt,
                exc.code,
                exc.detail,
            )
            continue

        if merged:
            logger.info(
                "Detection success on attempt=%s labels=%s",
                attempt,
                [item["label"] for item in merged],
            )
            return merged

        logger.warning(
            "Detection returned no items on attempt=%s mime_type=%s image_bytes=%s",
            attempt,
            mime_type,
            len(image_data),
        )

    if last_error:
        raise last_error

    return []
