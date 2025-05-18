from flask import Blueprint, request, jsonify, Response
from bson import ObjectId
from gridfs import GridFS
from extensions import mongo

fs = GridFS(mongo.db)
uploads_bp = Blueprint("uploads_bp", __name__, url_prefix="/upload")

@uploads_bp.route("", methods=["POST"])
def upload_image():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "no file provided"}), 400

    # store in GridFS
    file_id = fs.put(
        file,
        filename=file.filename,
        content_type=file.mimetype
    )
    return jsonify({"fileId": str(file_id)}), 200

@uploads_bp.route("/<file_id>", methods=["GET"])
def serve_image(file_id):
    try:
        grid_out = fs.get(ObjectId(file_id))
    except:
        return jsonify({"error": "not found"}), 404

    return Response(grid_out.read(), mimetype=grid_out.content_type)
