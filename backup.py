from flask import Flask, request, jsonify, send_file, send_from_directory, render_template
from PIL import Image
import cv2
import numpy as np
import os
import traceback
import logging
import mediapipe as mp

# ตั้งค่า logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

# สร้างโฟลเดอร์ถ้ายังไม่มี
for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# เริ่มต้น Mediapipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

def detect_empty_face_area(image):
    try:
        if image.shape[2] < 4:
            logger.warning("ภาพไม่มีอัลฟาแชนแนล: อาจไม่รองรับพื้นที่โปร่งใส")
            return None

        alpha_channel = image[:, :, 3]
        transparent_area = cv2.findNonZero(255 - alpha_channel)

        if transparent_area is not None:
            x, y, w, h = cv2.boundingRect(transparent_area)
            return (x, y, w, h)
        else:
            logger.warning("ไม่พบพื้นที่โปร่งใสในเทมเพลต")
            return None

    except Exception as e:
        logger.error(f"Error in detect_empty_face_area: {str(e)}")
        logger.error(traceback.format_exc())
        return None


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

        # ปาจุดศูนย์กลางและขนาดของใบหน้า
        left = min(pt[0] for pt in points)
        right = max(pt[0] for pt in points)
        top = min(pt[1] for pt in points)
        bottom = max(pt[1] for pt in points)
        
        center_x = (left + right) // 2
        center_y = (top + bottom) // 2
        face_width = int((right - left) * 1)  # เพิ่มขนาดเล็กน้อย
        face_height = int((bottom - top) * 1)  # เพิ่มขนาดเล็กน้อย

        # สร้าง mask วงรี
        mask = np.zeros((h, w), dtype=np.uint8)
        axes = (face_width // 2, face_height // 2)
        cv2.ellipse(mask, (center_x, center_y), axes, 0, 0, 360, 255, -1)

        # ทำให้ขอบนุ่มขึ้น
        mask = cv2.GaussianBlur(mask, (41, 41), 6)
        _, mask = cv2.threshold(mask, 200, 255, cv2.THRESH_BINARY)

        # ตัดภาพใบหน้าด้วย mask
        face = cv2.bitwise_and(image, image, mask=mask)

        # ตัดเฉพาะส่วนที่มีใบหน้า
        x = center_x - face_width // 2
        y = center_y - face_height // 2
        cropped_face = face[y:y+face_height, x:x+face_width]
        
        # สร้าง alpha channel
        mask_cropped = mask[y:y+face_height, x:x+face_width]
        b, g, r = cv2.split(cropped_face)
        cropped_face_rgba = cv2.merge([b, g, r, mask_cropped])

        return cropped_face_rgba, None

    except Exception as e:
        logger.error(f"Error in extract_face: {str(e)}")
        logger.error(traceback.format_exc())
        return None, f"เกิดข้อผิดพลาด: {str(e)}"


def remove_white_background(image):
    # แปลงภาพเป็น grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
    
    _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    
    # ใช้ morphological operations เพื่อกำจัดจุดรบกวน
    kernel = np.ones((3,3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # สร้าง alpha channel
    b, g, r, a = cv2.split(image)
    a = cv2.bitwise_and(a, mask)
    
    # รวมช่องสีกลับ
    return cv2.merge([b, g, r, a])

def process_image(image_path, template_path):
    try:
        if not os.path.exists(image_path):
            return None, "ไม่พบไฟล์ภาพที่อัพโหลด"
        if not os.path.exists(template_path):
            return None, "ไม่พบไฟล์เทมเพลต"

        cropped_face, error = extract_face(image_path)
        if error:
            return None, error

        # ลบขอบสีขาวออกจากภาพใบหน้า
        cropped_face = remove_white_background(cropped_face)

        template = cv2.imread(template_path, cv2.IMREAD_UNCHANGED)
        if template is None:
            return None, "ไม่สามารถอ่านไฟล์เทมเพลตได้"

        empty_face = detect_empty_face_area(template)
        if not empty_face:
            return None, "ไม่พบพื้นที่ว่างสำหรับใบหน้าในภาพการ์ตูน"

        ex, ey, ew, eh = empty_face

        # ปรับขนาดใบหน้าให้ใหญ่ขึ้นเล็กน้อย
        scale_factor = 1.1  # เพิ่มขนาดใบหน้า 10%
        new_width = int(ew * scale_factor)
        new_height = int(eh * scale_factor)
        face_resized = cv2.resize(cropped_face, (new_width, new_height), interpolation=cv2.INTER_AREA)

        # คำนวณตำแหน่งใหม่ให้ใบหน้าอยู่ตรงกลาง
        offset_x = (new_width - ew) // 2
        offset_y = (new_height - eh) // 2

        # แปลงภาพใบหน้าเป็น PIL Image
        face_pil = Image.fromarray(cv2.cvtColor(face_resized, cv2.COLOR_BGRA2RGBA))

        # แปลงภาพเทมเพลตเป็น PIL Image
        template_pil = Image.fromarray(cv2.cvtColor(template, cv2.COLOR_BGRA2RGBA))

        # สร้างภาพใหม่ขนาดเท่ากับเทมเพลต
        result = Image.new('RGBA', template_pil.size, (0, 0, 0, 0))

        # วางใบหน้าก่อน (อยู่ด้านหลัง)
        result.paste(face_pil, (ex - offset_x, ey - offset_y), face_pil)

        # วางเทมเพลตทับ (อยู่ด้านหน้า)
        result.paste(template_pil, (0, 0), template_pil)

        # ตัดพื้นหลังโปร่งใสหลังจากรวมใบหน้าและเทมเพลต
        result_cv = cv2.cvtColor(np.array(result), cv2.COLOR_RGBA2BGRA)
        result_cleaned = remove_white_background(result_cv)

        # บันทึกผลลัพธ์
        output_path = os.path.join(OUTPUT_FOLDER, "output.png")
        cv2.imwrite(output_path, result_cleaned)

        return output_path, None

    except Exception as e:
        logger.error(f"Error in process_image: {str(e)}")
        logger.error(traceback.format_exc())
        return None, f"เกิดข้อผิดพลาด: {str(e)}"


@app.route("/upload", methods=["POST"])
def upload_file():
    try:
        if "file" not in request.files or "template" not in request.files:  # ตรวจสอบไฟล์การ์ตูน
            return jsonify({"error": "กรุณาเลือกไฟล์ภาพและไฟล์การ์ตูน"}), 400

        file = request.files["file"]
        template_file = request.files["template"]  # รับไฟล์การ์ตูน
        if file.filename == "" or template_file.filename == "":
            return jsonify({"error": "ไม่ได้เลือกไฟล์"}), 400

        allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.jpe'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        template_ext = os.path.splitext(template_file.filename)[1].lower()  # ตรวจสอบนามสกุลไฟล์การ์ตูน
        if file_ext not in allowed_extensions or template_ext not in allowed_extensions:
            return jsonify({"error": "รูปแบบไฟล์ไม่ถูกต้อง"}), 400

        # กำหนด path สำหรับบันทึกไฟล์ที่อัพโหลด
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        template_path = os.path.join(UPLOAD_FOLDER, template_file.filename)

        # บันทึกไฟล์
        file.save(file_path)
        template_file.save(template_path)

        output_path, error = process_image(file_path, template_path)

        if error:
            return jsonify({"error": error}), 400

        if output_path and os.path.exists(output_path):
            # เปลี่ยนเป็นการส่ง URL ของไฟล์ที่ถูกสร้าง
            image_url = f"/outputs/{os.path.basename(output_path)}"
            return jsonify({"imageUrl": image_url})  # ส่ง URL กลับไปให้ client
        else:
            return jsonify({"error": "ไม่สามารถสร้างไฟล์ผลลัพธ์ได้"}), 500

    except Exception as e:
        logger.error(f"Error in upload_file: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"เกิดข้อผิดพลาด: {str(e)}"}), 500

# เพิ่มเส้นทางเพื่อให้ Flask สามารถส่งไฟล์จากโฟลเดอร์ OUTPUTS
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
