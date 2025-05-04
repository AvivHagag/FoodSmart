# backend/routes/meals.py

import json
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify
from extensions import mongo

meals_bp = Blueprint("meals_bp", __name__, url_prefix="/meals")

def _parse_iso(dt_str: str) -> datetime:
    """Parse ISO8601 strings, allowing trailing Z."""
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))

@meals_bp.route("", methods=["POST"])
def post_meal():
    # 1) Parse JSON body
    data = request.get_json(force=True)

    # 2) Validate incoming fields
    user_id    = data.get("userId")
    date_str   = data.get("date")
    total_cal  = data.get("totalCalories", 0)
    total_fat  = data.get("totalFat", 0)
    total_pro  = data.get("totalProtein", 0)
    total_carb = data.get("totalCarbo", 0)
    meals_list = data.get("mealsList")

    if not (user_id and date_str and isinstance(meals_list, list)):
        return jsonify({"error": "Missing or invalid fields"}), 400

    # 3) Convert userId to ObjectId
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid userId"}), 400

    # 4) Parse and normalize date to midnight UTC
    try:
        raw_day = _parse_iso(date_str)
        day = datetime(raw_day.year, raw_day.month, raw_day.day)
    except Exception:
        return jsonify({"error": "Invalid date format"}), 400

    # 5) Build each new meal entry, now including "name"
    new_entries = []
    for m in meals_list:
        try:
            name = m.get("name")
            tm = _parse_iso(m["time"])
            entry = {
                "name":     name,
                "time":     tm,
                "calories": float(m.get("calories", 0)),
                "fat":      float(m.get("fat", 0)),
                "protein":  float(m.get("protein", 0)),
                "carbo":    float(m.get("carbo", 0)),
                "imageUri": m.get("imageUri")
            }
        except Exception:
            return jsonify({"error": "Invalid mealsList entry"}), 400
        new_entries.append(entry)

    # 6) Look for an existing document for (userId, date)
    existing = mongo.db.meals.find_one({
        "userId": user_oid,
        "date":   day
    })

    if existing:
        # 6a) Update the existing day's totals and append new meals
        mongo.db.meals.update_one(
            {"_id": existing["_id"]},
            {
                "$inc": {
                    "totalCalories": total_cal,
                    "totalFat":      total_fat,
                    "totalProtein":  total_pro,
                    "totalCarbo":    total_carb,
                },
                "$push": {
                    "mealsList": {"$each": new_entries}
                }
            }
        )
    else:
        # 6b) Insert a new day document
        doc = {
            "userId":        user_oid,
            "date":          day,
            "totalCalories": total_cal,
            "totalFat":      total_fat,
            "totalProtein":  total_pro,
            "totalCarbo":    total_carb,
            "mealsList":     new_entries
        }
        mongo.db.meals.insert_one(doc)

    # 7) Fetch and serialize the updated document
    updated = mongo.db.meals.find_one({
        "userId": user_oid,
        "date":   day
    })
    updated["_id"]    = str(updated["_id"])
    updated["userId"] = str(updated["userId"])
    updated["date"]   = updated["date"].isoformat()
    for item in updated.get("mealsList", []):
        item["time"] = item["time"].isoformat()

    return jsonify(updated), 200
