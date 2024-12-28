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

def detect_green_screen_area(image):
    # แปลงภาพเป็น HSV
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # กำหนดช่วงสีเขียวใน HSV
    lower_green = np.array([35, 100, 100])
    upper_green = np.array([85, 255, 255])

    # สร้าง mask สำหรับพื้นที่สีเขียว
    mask = cv2.inRange(hsv_image, lower_green, upper_green)

    # ค้นหาพื้นที่ที่ไม่เป็นศูนย์ใน mask
    green_area = cv2.findNonZero(mask)

    if green_area is not None:
        x, y, w, h = cv2.boundingRect(green_area)
        return (x, y, w, h)
    else:
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
        mask = cv2.GaussianBlur(mask, (61, 61), 6)
        _, mask = cv2.threshold(mask, 200, 255, cv2.THRESH_BINARY)

        # ตัดภาพใบหน้าด้วย mask
        face = cv2.bitwise_and(image, image, mask=mask)

        # ตัดเฉพาะส่วนที่มีใบหน้า
        x = center_x - face_width // 2
        y = center_y - face_height // 2
        cropped_face = face[y:y + face_height, x:x + face_width]
        
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
    
    _, mask = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)
    
    # ใช้ morphological operations เพื่อกำจัดจุดรบกวน
    kernel = np.ones((3,3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # สร้าง alpha channel
    b, g, r, a = cv2.split(image)
    a = cv2.bitwise_and(a, mask)
    
    # รวมช่องสีกลับ
    return cv2.merge([b, g, r, a])

def add_3d_effect(image):
    try:
        # ขนาดภาพ
        h, w, c = image.shape

        # สร้างแสงตรงกลาง
        center_x, center_y = w // 1, h // 1
        max_radius = max(center_x, center_y)

        # สร้าง mask วงกลมสำหรับเงา
        Y, X = np.ogrid[:h, :w]
        distance_from_center = np.sqrt((X - center_x)**2 + (Y - center_y)**2)
        mask = (1 - np.clip(distance_from_center / max_radius, 0, 3)) ** 2

        # ปรับแสงในภาพ
        for i in range(3):  # ใช้กับแต่ละ channel (B, G, R)
            image[:, :, i] = cv2.addWeighted(image[:, :, i], 1, (mask * 255).astype(np.uint8), 0.5, 0)

        # ใช้ GaussianBlur เพื่อลด noise และทำให้ดูนุ่มนวล
        image = cv2.GaussianBlur(image, (60, 60), 10)

        return image

    except Exception as e:
        logger.error(f"Error in add_3d_effect: {str(e)}")
        return image


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
        cropped_face = add_3d_effect(cropped_face)
        

        template = cv2.imread(template_path, cv2.IMREAD_UNCHANGED)
        if template is None:
            return None, "ไม่สามารถอ่านไฟล์เทมเพลตได้"

        # ตรวจจับพื้นที่สีเขียวในเทมเพลต
        green_area = detect_green_screen_area(template)
        if not green_area:
            return None, "ไม่พบพื้นที่สีเขียวในภาพการ์ตูน"

        ex, ey, ew, eh = green_area

        # ปรับขนาดใบหน้าให้ใหญ่ขึ้นเล็กน้อย
        scale_factor = 1.1  # เพิ่มขนาดใบหน้า 10%
        new_width = int(ew * scale_factor)
        new_height = int(eh * scale_factor)
        face_resized = cv2.resize(cropped_face, (new_width, new_height), interpolation=cv2.INTER_AREA)

        # คำนวณตำแหน่งใหม่ให้ใบหน้าอยู่ตรงกลาง
        offset_x = (ew - face_resized.shape[1]) // 2
        offset_y = (eh - face_resized.shape[0]) // 2

        # แปลงภาพใบหน้าเป็น PIL Image
        face_pil = Image.fromarray(cv2.cvtColor(face_resized, cv2.COLOR_BGRA2RGBA))

        # แปลงภาพเทมเพลตเป็น PIL Image
        template_pil = Image.fromarray(cv2.cvtColor(template, cv2.COLOR_BGRA2RGBA))

        # สร้างภาพใหม่ขนาดเท่ากับเทมเพลต
        result = Image.new('RGBA', template_pil.size, (0, 0, 0, 0))

        # วางเทมเพลตทับ (อยู่ด้านหน้า)
        result.paste(template_pil, (0, 0), template_pil)

        # วางใบหน้าก่อน (อยู่ด้านหลัง)
        result.paste(face_pil, (ex + offset_x, ey + offset_y), face_pil)



        # ตัดพื้นหลังโปร่งใสหลังจากรวมใบหน้าและเทมเพลต
        result_cv = cv2.cvtColor(np.array(result), cv2.COLOR_RGBA2BGRA)
        result_cleaned = remove_white_background(result_cv)

        # บันทึกผลลัพธ์
        output_path = os.path.join(OUTPUT_FOLDER, "output.png")
        cv2.imwrite(output_path, result_cleaned)

        logger.debug(f"Face size: {face_resized.shape}, Position: ({ex + offset_x}, {ey + offset_y})")

        return output_path, None

    except Exception as e:
        logger.error(f"Error in process_image: {str(e)}")
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
