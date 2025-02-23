<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

include('connect.php');
$conn = dbconnect();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

$userMessage = $_POST['userMessage'] ?? '';
$message = $_POST['message'] ?? '';
$eventName = $_POST['eventName'] ?? '';

// ตรวจสอบว่ามีไฟล์อัพโหลดหรือไม่
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    // มีไฟล์ ให้จัดการอัพโหลด
    $fileTmpPath = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];

    $uploadFolder = __DIR__ . '/uploads/';
    if (!is_dir($uploadFolder)) {
        mkdir($uploadFolder, 0755, true);
    }

    // สร้างชื่อไฟล์ใหม่เพื่อป้องกันชื่อซ้ำ
    $newFileName = time() . '_' . preg_replace('/\s+/', '_', $fileName);
    $destPath = $uploadFolder . $newFileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        // เก็บเฉพาะ path ในฐานข้อมูล
        $imagePath = 'uploads/' . $newFileName;

        $stmt = $conn->prepare("INSERT INTO savecartoon (image, user_message, message, event_name) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $imagePath, $userMessage, $message, $eventName);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Cartoon saved successfully"]);
        } else {
            echo json_encode(["error" => "Failed to save cartoon"]);
        }
        $stmt->close();
    } else {
        echo json_encode(["error" => "Failed to move uploaded file"]);
    }
} else {
    // ไม่มีไฟล์ แต่อาจมี path ของการ์ตูนที่เลือกจากระบบ
    $imagePath = $_POST['imagePath'] ?? '';
    if ($imagePath) {
        // บันทึก path นี้ลง DB
        $stmt = $conn->prepare("INSERT INTO savecartoon (image, user_message, message, event_name) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $imagePath, $userMessage, $message, $eventName);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Cartoon saved successfully"]);
        } else {
            echo json_encode(["error" => "Failed to save cartoon"]);
        }
        $stmt->close();
    } else {
        echo json_encode(["error" => "No file uploaded or imagePath provided"]);
    }
}

$conn->close();
?>
