import os
from bson import ObjectId
from flask import Blueprint, request, jsonify
from extensions import mongo
import boto3
from dotenv import load_dotenv
import uuid

load_dotenv()

update_basic_info_bp = Blueprint("update_basic_info_bp", __name__, url_prefix="/api")

s3 = boto3.client('s3',
    endpoint_url=os.getenv('R2_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
    region_name='auto'
)
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
R2_PUBLIC_URL = os.getenv('R2_PUBLIC_URL', '')

if not R2_BUCKET_NAME:
    raise RuntimeError("Missing R2_BUCKET_NAME environment variable")

@update_basic_info_bp.route("/update_basic_info", methods=["POST"])
def update_basic_info():
    data = request.form.to_dict()
    user_id = data.get("userID")
    fullname = data.get("fullname")
    email = data.get("email")
    
    if not all([user_id, fullname, email]):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        user_oid = ObjectId(user_id)
    except:
        return jsonify({"error": "Invalid user ID"}), 400
    
    existing_user = mongo.db.users.find_one({"email": email, "_id": {"$ne": user_oid}})
    if existing_user:
        return jsonify({"error": "Email already in use by another account"}), 400
    
    update_data = {
        "fullname": fullname,
        "email": email
    }
    
    if 'image' in request.files:
        img = request.files['image']
        img_data = img.read()
        if img_data:  # Only process if there's actual image data
            mimetype = img.mimetype
            filename = f"{uuid.uuid4()}-{img.filename}"
            
            try:
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
                
                update_data["image"] = public_url
            except Exception as e:
                return jsonify({"error": f"Image upload failed: {str(e)}"}), 500
    
    # Update user data
    result = mongo.db.users.update_one(
        {"_id": user_oid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
    
    updated_user = mongo.db.users.find_one({"_id": user_oid})
    if updated_user:
        updated_user["_id"] = str(updated_user["_id"])
        if "password" in updated_user:
            del updated_user["password"]
        
        return jsonify({
            "message": "User information updated successfully",
            "user": updated_user
        }), 200
    else:
        return jsonify({"error": "Failed to retrieve updated user information"}), 500 