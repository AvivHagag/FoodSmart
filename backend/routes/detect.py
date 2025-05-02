from flask import Blueprint, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np

detect_bp = Blueprint('detect_bp', __name__)
model = YOLO("best.pt")
@detect_bp.route('/detect', methods=['POST'])
def detect():
    try:
        print("Request content type:", request.content_type)

        if 'image' not in request.files:
            print("No image found in request.files")
            return jsonify({"error": "No image provided"}), 400

        file = request.files['image']
        print(f"Image file received: {file.filename} of type {file.content_type}")

        npimg = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            print("Failed to decode image")
            return jsonify({"error": "Failed to decode image"}), 400

        results = model(img)

        detected_objects = []
        for result in results:
            if hasattr(result, 'boxes') and result.boxes is not None:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    label_index = int(box.cls[0])
                    label = model.names[label_index]
                    confidence = float(box.conf[0])

                    detected_objects.append({
                        "label": label,
                        "confidence": confidence
                    })

        return jsonify(detected_objects)

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
