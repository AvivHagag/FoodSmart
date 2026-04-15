from __future__ import annotations

from functools import lru_cache

from openai import OpenAI

from app.core.config import get_settings
from app.core.exceptions import AppException


@lru_cache
def get_openai_client() -> OpenAI:
    settings = get_settings()
    if not settings.openai_api_key:
        raise AppException(503, "OpenAI is not configured", "openai_not_configured")
    return OpenAI(api_key=settings.openai_api_key)
