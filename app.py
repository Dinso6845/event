from flask import Flask, request, jsonify, send_file, send_from_directory
from PIL import Image
import cv2
import numpy as np
import os
import traceback
import logging
import mediapipe as mp
from flask_cors import CORS
import base64

# ตั้งค่า logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # เปิดใช้งาน CORS สำหรับทุกเส้นทาง
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

# สร้างโฟลเดอร์ถ้ายังไม่มี
for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# เริ่มต้น Mediapipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

# ฟังก์ชันตรวจจับพื้นที่สีเขียว
def detect_green_screen_area(image):
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    lower_green = np.array([35, 100, 100])
    upper_green = np.array([85, 255, 255])
    mask = cv2.inRange(hsv_image, lower_green, upper_green)
    green_area = cv2.findNonZero(mask)
    return cv2.boundingRect(green_area) if green_area is not None else None

# ฟังก์ชันตัดใบหน้า
def extract_face(image_path):
    try:
        image = cv2.imread(image_path)
        if image is None:
            return None, "ไม่สามารถอ่านไฟล์ภาพได้"

        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_image)
        if not results.multi_face_landmarks:
            return None, "ไม่พบใบหน้าในภาพ"

        landmarks = results.multi_face_landmarks[0]
        h, w, _ = image.shape
        points = [(int(pt.x * w), int(pt.y * h)) for pt in landmarks.landmark]
        left, right = min(pt[0] for pt in points), max(pt[0] for pt in points)
        top, bottom = min(pt[1] for pt in points), max(pt[1] for pt in points)
        center_x, center_y = (left + right) // 2, (top + bottom) // 2
        face_width, face_height = int((right - left) * 1.1), int((bottom - top) * 1.1)

        mask = np.zeros((h, w), dtype=np.uint8)
        axes = (face_width // 2, face_height // 2)
        cv2.ellipse(mask, (center_x, center_y), axes, 0, 0, 360, 255, -1)
        mask = cv2.GaussianBlur(mask, (61, 61), 6)
        _, mask = cv2.threshold(mask, 200, 255, cv2.THRESH_BINARY)

        face = cv2.bitwise_and(image, image, mask=mask)
        x, y = center_x - face_width // 2, center_y - face_height // 2
        cropped_face = face[y:y + face_height, x:x + face_width]

        mask_cropped = mask[y:y+face_height, x:x+face_width]
        b, g, r = cv2.split(cropped_face)
        cropped_face_rgba = cv2.merge([b, g, r, mask_cropped])
        return cropped_face_rgba, None
    except Exception as e:
        logger.error(f"Error in extract_face: {str(e)}")
        return None, f"เกิดข้อผิดพลาด: {str(e)}"

# ฟังก์ชันลบพื้นหลังสีขาว
def remove_white_background(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
    _, mask = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    b, g, r, a = cv2.split(image)
    a = cv2.bitwise_and(a, mask)
    return cv2.merge([b, g, r, a])

# ฟังก์ชันประมวลผลภาพ
def process_image(image_path, template_base64):
    try:
        if not os.path.exists(image_path):
            return None, "ไม่พบไฟล์ภาพที่อัพโหลด"

        missing_padding = len(template_base64) % 4
        if missing_padding:
            template_base64 += '=' * (4 - missing_padding)

        template_data = base64.b64decode(template_base64)
        template = cv2.imdecode(np.frombuffer(template_data, np.uint8), cv2.IMREAD_UNCHANGED)
        if template is None or template.size == 0:
            return None, "ไม่สามารถแปลง Base64 เป็นภาพได้"

        cropped_face, error = extract_face(image_path)
        if error:
            return None, error

        cropped_face = remove_white_background(cropped_face)
        green_area = detect_green_screen_area(template)
        if not green_area:
            return None, "ไม่พบพื้นที่สีเขียวในภาพการ์ตูน"

        ex, ey, ew, eh = green_area
        scale_factor = 1.1
        new_width, new_height = int(ew * scale_factor), int(eh * scale_factor)
        face_resized = cv2.resize(cropped_face, (new_width, new_height), interpolation=cv2.INTER_AREA)
        offset_x, offset_y = (ew - face_resized.shape[1]) // 2, (eh - face_resized.shape[0]) // 2

        template_pil = Image.fromarray(cv2.cvtColor(template, cv2.COLOR_BGRA2RGBA))
        face_pil = Image.fromarray(cv2.cvtColor(face_resized, cv2.COLOR_BGRA2RGBA))
        result = Image.new('RGBA', template_pil.size, (0, 0, 0, 0))
        result.paste(template_pil, (0, 0), template_pil)
        result.paste(face_pil, (ex + offset_x, ey + offset_y), face_pil)

        result_cv = cv2.cvtColor(np.array(result), cv2.COLOR_RGBA2BGRA)
        result_cleaned = remove_white_background(result_cv)
        output_path = os.path.join(OUTPUT_FOLDER, "output.png")
        cv2.imwrite(output_path, result_cleaned)
        return output_path, None
    except Exception as e:
        logger.error(f"Base64 decode error: {str(e)}")
        return None, f"ไม่สามารถถอดรหัส Base64 ได้: {str(e)}"

@app.route("/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    cartoon_id = request.form.get("cartoonId")
    if not file or not cartoon_id:
        return jsonify({"error": "กรุณาเลือกรูปภาพและการ์ตูน"}), 400

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in {'.png', '.jpg', '.jpeg', '.gif', '.jpe'}:
        return jsonify({"error": "รูปแบบไฟล์ไม่ถูกต้อง"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        output_path, error = process_image(file_path, cartoon_id)
        if error:
            return jsonify({"error": error}), 400

        if os.path.exists(output_path):
            return jsonify({"imageUrl": f"/outputs/{os.path.basename(output_path)}"})
        else:
            return jsonify({"error": "ไม่สามารถสร้างไฟล์ผลลัพธ์ได้"}), 500
    finally:
        os.remove(file_path)

@app.route("/outputs/<filename>")
def serve_output(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)

@app.route("/", methods=["GET"])
def home():
    return send_file("index.html", mimetype="text/html")

@app.route("/index.css")
def serve_css():
    return send_file("index.css", mimetype="text/css")

@app.route('/app.js')
def serve_js():
    return send_from_directory('.', 'app.js')

@app.route("/result.html")
def result():
    return send_file("result.html")

if __name__ == "__main__":
    app.run(debug=True)
