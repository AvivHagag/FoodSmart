from __future__ import annotations

import os

from app.core.config import get_settings


def pytest_runtest_setup():
    os.environ.setdefault("MONGO_URI", "mongodb://127.0.0.1:27017/foodsmart_test")
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
    get_settings.cache_clear()
