from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from app.db.mongo import get_database


def create_record(user_id: str, advice: dict):
    return get_database().advice_history.insert_one(
        {
            "user_id": ObjectId(user_id),
            "advice": advice,
            "created_at": datetime.utcnow(),
        }
    )


def list_recent(user_id: str, limit: int = 5):
    return list(
        get_database().advice_history.find(
            {"user_id": ObjectId(user_id)},
            sort=[("created_at", -1)],
            limit=limit,
        )
    )
