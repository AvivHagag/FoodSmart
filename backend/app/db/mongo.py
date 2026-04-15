from __future__ import annotations

import certifi
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConfigurationError, ServerSelectionTimeoutError

from app.core.config import Settings
from app.core.exceptions import AppException


_client: MongoClient | None = None
_database: Database | None = None


def init_mongo(settings: Settings) -> None:
    global _client, _database

    if _client is not None and _database is not None:
        return

    try:
        _client = MongoClient(
            settings.mongo_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
        )
        _client.admin.command("ping")
        _database = _client.get_default_database()
        if _database is None:
            raise AppException(
                500,
                "Mongo connection string must include a database name",
                "mongo_database_missing",
            )
    except ConfigurationError as exc:
        raise AppException(
            500,
            f"MongoDB configuration failed: {exc}",
            "mongo_configuration_error",
        ) from exc
    except ServerSelectionTimeoutError as exc:
        raise AppException(
            500,
            f"MongoDB is unreachable: {exc}",
            "mongo_unreachable",
        ) from exc


def get_database() -> Database:
    if _database is None:
        raise AppException(500, "MongoDB is not initialized", "mongo_not_initialized")
    return _database


def close_mongo() -> None:
    global _client, _database
    if _client is not None:
        _client.close()
    _client = None
    _database = None
