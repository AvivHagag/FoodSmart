from flask import Blueprint, request, jsonify
from ultralytics import YOLO
import cv2, numpy as np, os, base64, json, re
from dotenv import load_dotenv
from openai import OpenAI, OpenAIError

load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise RuntimeError("Please set OPENAI_API_KEY in your .env file")
client = OpenAI(api_key=API_KEY)
detect_bp = Blueprint('detect_bp', __name__)
model = YOLO("best.pt")
YOLO_CONF_THRESHOLD = 0.6 

@detect_bp.route('/detect', methods=['POST'])
def detect():
    try:

        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        data = request.files['image'].read()
        npimg = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({"error": "Failed to decode image"}), 400

        results = model(img)
        yolo_objects = []
        for res in results:
            for box in getattr(res, "boxes", []):
                conf = float(box.conf[0])
                label = model.names[int(box.cls[0])]
                if conf < YOLO_CONF_THRESHOLD:
                    continue
                yolo_objects.append({"label": label, "confidence": conf})

        if yolo_objects:
            return jsonify(yolo_objects)

        print("No YOLO hits, falling back to OpenAI Vision…")
        b64_image = base64.b64encode(data).decode('utf-8')
        vision_prompt = [
            {
                "type": "text",
                "text": (
                    "Identify each individual food item in this image and return a pure JSON array of objects, "
                    "each with keys 'label' (string) and 'confidence' (number 0–1). "
                    "No markdown, no code fences, no extra text. Example: [{\"label\":\"Chicken\",\"confidence\":0.9}, ...]"
                )
            },
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}}
        ]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": vision_prompt}],
            temperature=0,
            max_tokens=200,
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?\n?", "", content)
        content = re.sub(r"\n?```$", "", content)

        try:
            vision_objects = json.loads(content)
        except Exception as e:
            return jsonify({"error": "Vision parse failed", "details": str(e)}), 500

        return jsonify(vision_objects), 200

    except OpenAIError as e:
        return jsonify({"error": "OpenAI API error", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

