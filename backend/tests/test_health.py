import os

from fastapi.testclient import TestClient

from app.core.config import get_settings


def test_healthcheck(monkeypatch):
    os.environ["MONGO_URI"] = "mongodb://127.0.0.1:27017/foodsmart_test"
    os.environ["JWT_SECRET_KEY"] = "test-secret"
    get_settings.cache_clear()

    import app.main as main_module

    monkeypatch.setattr(main_module, "init_mongo", lambda settings: None)
    monkeypatch.setattr(main_module, "apply_indexes", lambda: None)
    monkeypatch.setattr(main_module, "close_mongo", lambda: None)

    with TestClient(main_module.app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
