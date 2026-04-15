from __future__ import annotations

import random

import requests

from app.core.config import get_settings


def search_food_image(query: str) -> str | None:
    settings = get_settings()
    if not settings.unsplash_access_key or not query.strip():
        return None

    try:
        response = requests.get(
            "https://api.unsplash.com/search/photos",
            params={
                "query": f"{query} food",
                "orientation": "landscape",
                "per_page": 10,
                "content_filter": "high",
            },
            headers={
                "Authorization": f"Client-ID {settings.unsplash_access_key}",
                "Accept-Version": "v1",
            },
            timeout=10,
        )
        if not response.ok:
            return None
        results = response.json().get("results", [])
        if not results:
            return None
        return random.choice(results).get("urls", {}).get("small")
    except Exception:
        return None
