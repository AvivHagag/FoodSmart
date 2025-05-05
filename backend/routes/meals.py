import json
import os
from datetime import datetime
import uuid
from bson import ObjectId
from flask import Blueprint, request, jsonify, send_file, url_for, redirect
from extensions import mongo
import boto3
from dotenv import load_dotenv

load_dotenv()

meals_bp = Blueprint("meals_bp", __name__, url_prefix="/meals")

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT_URL"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    region_name="auto",
)
BUCKET     = os.getenv("R2_BUCKET_NAME")
PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "")

if not BUCKET:
    raise RuntimeError("Missing R2_BUCKET_NAME environment variable")

def _parse_iso(dt_str: str) -> datetime:
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))

@meals_bp.route("/upload", methods=["POST"])
def upload_image():
    try:
        img = request.files.get("image")
        if not img:
            return jsonify({"error": "No image provided"}), 400
        data = img.read()
        key  = f"{uuid.uuid4()}-{img.filename}"
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=data,
            ContentType=img.mimetype
        )
        url = (
            f"{PUBLIC_URL.rstrip('/')}/{key}"
            if PUBLIC_URL
            else s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET, "Key": key},
                ExpiresIn=31536000,
            )
        )
        return jsonify({"url": url}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Image upload failed: {e}"}), 500

@meals_bp.route("/images/<path:key>", methods=["GET"])
def get_image(key):
    try:
        if PUBLIC_URL:
            return redirect(f"{PUBLIC_URL.rstrip('/')}/{key}")
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET, "Key": key},
            ExpiresIn=3600,
        )
        return redirect(url)
    except Exception as e:
        return jsonify({"error": f"Image not found: {e}"}), 404

@meals_bp.route("", methods=["POST"])
def post_meal():
    data        = request.get_json(force=True)
    user_id     = data.get("userId")
    date_str    = data.get("date")
    total_cal   = data.get("totalCalories", 0)
    total_fat   = data.get("totalFat", 0)
    total_pro   = data.get("totalProtein", 0)
    total_carb  = data.get("totalCarbo", 0)
    meals_list  = data.get("mealsList")

    if not (user_id and date_str and isinstance(meals_list, list)):
        return jsonify({"error": "Missing or invalid fields"}), 400

    try:
        user_oid = ObjectId(user_id)
    except:
        return jsonify({"error": "Invalid userId"}), 400

    try:
        raw_day = _parse_iso(date_str)
        day = datetime(raw_day.year, raw_day.month, raw_day.day)
    except:
        return jsonify({"error": "Invalid date format"}), 400

    existing = mongo.db.meals.find_one({
        "userId": user_oid,
        "date":   day
    })
    start_idx = len(existing.get("mealsList", [])) if existing else 0

    new_entries = []
    for idx, m in enumerate(meals_list, start=1):
        try:
            tm = _parse_iso(m["time"])
            seq = start_idx + idx
            entry = {
                "name":     f"Meal {seq}",
                "items":    m.get("items"),
                "time":     tm,
                "calories": float(m.get("calories", 0)),
                "fat":      float(m.get("fat", 0)),
                "protein":  float(m.get("protein", 0)),
                "carbo":    float(m.get("carbo", 0)),
                "imageUri": m.get("imageUri")
            }
        except:
            return jsonify({"error": "Invalid mealsList entry"}), 400
        new_entries.append(entry)

    if existing:
        mongo.db.meals.update_one(
            {"_id": existing["_id"]},
            {
                "$inc": {
                    "totalCalories": total_cal,
                    "totalFat":      total_fat,
                    "totalProtein":  total_pro,
                    "totalCarbo":    total_carb,
                },
                "$push": {"mealsList": {"$each": new_entries}}
            }
        )
    else:
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

    updated = mongo.db.meals.find_one({ "userId": user_oid, "date": day })
    updated["_id"]    = str(updated["_id"])
    updated["userId"] = str(updated["userId"])
    updated["date"]   = updated["date"].isoformat()
    for item in updated.get("mealsList", []):
        item["time"] = item["time"].isoformat()

    return jsonify(updated), 200
