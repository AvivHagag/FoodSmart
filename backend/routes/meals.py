import os
from datetime import datetime
import uuid
from bson import ObjectId
from flask import Blueprint, request, jsonify,redirect
from extensions import mongo
import boto3
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

meals_bp = Blueprint("meals_bp", __name__, url_prefix="/meals")

s3 = boto3.client('s3',
    endpoint_url=os.getenv('R2_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
    region_name='auto'
)
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
R2_PUBLIC_URL  = os.getenv('R2_PUBLIC_URL', '')

if not R2_BUCKET_NAME:
    raise RuntimeError("Missing R2_BUCKET_NAME environment variable")

def _parse_iso(dt_str: str) -> datetime:
    """Parse ISO8601 strings, allowing trailing Z."""
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))

@meals_bp.route("/upload", methods=["POST"])
def upload_image():
    """Accept a single file upload, store it in R2, and return its public URL."""
    try:
       
        if 'image' in request.files:
            img = request.files['image']
            img_data = img.read()
            mimetype = img.mimetype
            filename = f"{uuid.uuid4()}-{img.filename}"
        else:
            return jsonify({"error": "No image file provided"}), 400
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=filename,
            Body=img_data,
            ContentType=mimetype
        )
        
        if R2_PUBLIC_URL:
            public_url = f"{R2_PUBLIC_URL.rstrip('/')}/{filename}"
        else:
            public_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': R2_BUCKET_NAME, 'Key': filename},
                ExpiresIn=31536000
            )
        return jsonify({
            "url": public_url
        }), 200
    except Exception as e:
        import traceback
        print(f"R2 upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Image upload failed: {str(e)}"}), 500

@meals_bp.route("/images/<path:filename>", methods=["GET"])
def get_image(filename):
    """Redirect to the R2 image URL or generate a presigned URL."""
    try:
        if R2_PUBLIC_URL:
            return redirect(f"{R2_PUBLIC_URL.rstrip('/')}/{filename}")
        else:
            url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': R2_BUCKET_NAME, 'Key': filename},
                ExpiresIn=3600
            )
            return redirect(url)
    except Exception as e:
        return jsonify({"error": f"Image not found: {str(e)}"}), 404

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
        day = datetime.strptime(date_str, "%d/%m/%Y")
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
