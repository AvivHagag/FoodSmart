from __future__ import annotations

from bson import ObjectId

from app.db.mongo import get_database


def create_message(document: dict):
    return get_database().support_messages.insert_one(document)


def find_by_id(message_id: str):
    if not ObjectId.is_valid(message_id):
        return None
    return get_database().support_messages.find_one({"_id": ObjectId(message_id)})


def list_messages(query: dict, page: int, limit: int):
    skip = (page - 1) * limit
    return list(
        get_database()
        .support_messages.find(query)
        .sort("createdAt", -1)
        .skip(skip)
        .limit(limit)
    )


def count_messages(query: dict) -> int:
    return get_database().support_messages.count_documents(query)


def update_status(message_id: str, fields: dict):
    return get_database().support_messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": fields},
    )


def aggregate_stats():
    db = get_database()
    status_counts = list(
        db.support_messages.aggregate(
            [{"$group": {"_id": "$status", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}]
        )
    )
    priority_counts = list(
        db.support_messages.aggregate(
            [
                {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}},
            ]
        )
    )
    inquiry_counts = list(
        db.support_messages.aggregate(
            [
                {"$group": {"_id": "$inquiryType", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}},
            ]
        )
    )
    recent_messages = list(
        db.support_messages.find(
            {},
            {
                "name": 1,
                "email": 1,
                "subject": 1,
                "status": 1,
                "priority": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "inquiryType": 1,
                "message": 1,
                "phone": 1,
                "responses": 1,
                "assignedTo": 1,
                "tags": 1,
            },
        )
        .sort("createdAt", -1)
        .limit(5)
    )
    total_messages = db.support_messages.count_documents({})
    return status_counts, priority_counts, inquiry_counts, recent_messages, total_messages
