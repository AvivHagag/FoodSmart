from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from app.db.mongo import get_database


def find_day_by_user_and_date(user_id: str, day: datetime):
    return get_database().meals.find_one({"userId": ObjectId(user_id), "date": day})


def find_day_by_id_and_user(meal_day_id: str, user_id: str):
    return get_database().meals.find_one(
        {"_id": ObjectId(meal_day_id), "userId": ObjectId(user_id)}
    )


def insert_day(document: dict):
    return get_database().meals.insert_one(document)


def update_day_by_id(meal_day_id: str, fields: dict):
    return get_database().meals.update_one({"_id": ObjectId(meal_day_id)}, {"$set": fields})


def find_by_user_and_range(user_id: str, start: datetime, end: datetime):
    return list(
        get_database()
        .meals.find({"userId": ObjectId(user_id), "date": {"$gte": start, "$lt": end}})
        .sort("date", 1)
    )


def find_by_user_and_range_inclusive(user_id: str, start: datetime, end: datetime):
    return list(
        get_database()
        .meals.find({"userId": ObjectId(user_id), "date": {"$gte": start, "$lte": end}})
        .sort("date", 1)
    )
