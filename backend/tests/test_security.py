import os

from app.core.config import get_settings
from app.core.security import create_access_token, decode_access_token


def test_access_token_round_trip():
    os.environ["JWT_SECRET_KEY"] = "test-secret"
    get_settings.cache_clear()

    token = create_access_token("user-123")
    payload = decode_access_token(token)

    assert payload["sub"] == "user-123"
