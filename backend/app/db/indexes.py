from __future__ import annotations

import logging

from pymongo import ASCENDING, DESCENDING

from app.db.mongo import get_database


logger = logging.getLogger(__name__)


def apply_indexes() -> None:
    db = get_database()
    try:
        db.users.create_index([("email", ASCENDING)], unique=True, name="users_email_uq")
        db.meals.create_index(
            [("userId", ASCENDING), ("date", ASCENDING)],
            unique=True,
            name="meals_user_date_uq",
        )
        db.advice_history.create_index(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="advice_history_user_created_at_idx",
        )
        db.support_messages.create_index(
            [("createdAt", DESCENDING)],
            name="support_created_at_idx",
        )
        db.support_messages.create_index(
            [("status", ASCENDING), ("priority", ASCENDING)],
            name="support_status_priority_idx",
        )
    except Exception as exc:
        logger.warning("Index creation skipped: %s", exc)
