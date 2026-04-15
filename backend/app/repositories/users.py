from __future__ import annotations

from bson import ObjectId

from app.db.mongo import get_database


def create_user(document: dict):
    return get_database().users.insert_one(document)


def find_by_email(email: str):
    return get_database().users.find_one({"email": email.lower()})


def find_by_id(user_id: str):
    if not ObjectId.is_valid(user_id):
        return None
    return get_database().users.find_one({"_id": ObjectId(user_id)})


def email_exists_for_other_user(email: str, user_id: str) -> bool:
    return (
        get_database()
        .users.count_documents(
            {
                "email": email.lower(),
                "_id": {"$ne": ObjectId(user_id)},
            }
        )
        > 0
    )


def update_by_id(user_id: str, fields: dict):
    return get_database().users.update_one({"_id": ObjectId(user_id)}, {"$set": fields})


def delete_by_id(user_id: str):
    return get_database().users.delete_one({"_id": ObjectId(user_id)})
