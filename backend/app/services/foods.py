from __future__ import annotations

import json

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.integrations.openai_client import get_openai_client
from app.schemas.foods import FoodLookupRequest


def lookup_food_nutrition(payload: FoodLookupRequest) -> dict:
    prompt = f"""You are a registered nutritionist. Given the food name "{payload.name}", provide its nutritional values normalized to 100g.

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

    client = get_openai_client()
    response = client.chat.completions.create(
        model=get_settings().openai_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=300,
    )
    content = response.choices[0].message.content or ""
    try:
        return json.loads(content.strip())
    except json.JSONDecodeError as exc:
        raise AppException(500, "Failed to parse nutrition response", "nutrition_parse_failed") from exc
