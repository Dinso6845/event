<?php
header('Access-Control-Allow-Origin: http://127.0.0.1:5000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 0); 
ini_set('log_errors', 1);
ini_set('error_log', 'errors.log'); 
ob_clean();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // ถ้าเป็น OPTIONS request ให้ส่ง 200 OK
    http_response_code(200);
    exit();
}

include('connect.php');
$conn = dbconnect();

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
if (!$conn) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to connect to the database."]);
    exit();
}

// ตรวจสอบว่าเป็นการอัพเดตหรือดึงข้อมูล
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $event_id = isset($_POST['event_id']) ? intval($_POST['event_id']) : 0;

    if (!$event_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing or invalid event_id"]);
        exit();
    }

    $updates = [];
    $params = [];
    $types = "";

    // จัดการการอัพโหลดไฟล์
    $upload_dir = "uploads/";
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    // ดึงข้อมูล events
    $sqlEvent = "SELECT `id`, `name`, `background_path`, `button_color`, `text_color`, `message`, `text_button`, `status`, `music`, `created_at`, `updated_at`, `toptext_color`, `sender_color`
                 FROM `events` 
                 WHERE `id` = $event_id";
    $resultEvent = $conn->query($sqlEvent);

    // ตรวจสอบว่า event นั้นมีอยู่จริง
    if (!$resultEvent || $resultEvent->num_rows == 0) {
        http_response_code(404);
        echo json_encode(["error" => "Event not found."]);
        exit();
    }

    $event = $resultEvent->fetch_assoc();

    // จัดการการลบไฟล์
    if (isset($_POST['remove_background'])) {
        $updates[] = "background_path = ?";
        $params[] = "";
        $types .= "s";
        // ลบไฟล์พื้นหลังเดิมออกจากเซิร์ฟเวอร์
        if (!empty($event['background_path'])) {
            unlink($event['background_path']);
        }
    }
    if (isset($_POST['remove_music'])) {
        $updates[] = "music = ?";
        $params[] = "";
        $types .= "s";
    }

    // อัพเดทข้อมูลพื้นฐาน
    $fields = [
        'status' => 's',
        'name' => 's',
        'button_color' => 's',
        'text_color' => 's',
        'message' => 's',
        'text_button' => 's',
        'toptext_color' => 's',
        'sender_color' => 's'
    ];

    foreach ($fields as $field => $type) {
        if (isset($_POST[$field]) && $_POST[$field] !== '') {
            $updates[] = "`$field` = ?";
            $params[] = $_POST[$field];
            $types .= $type;
        }
    }

    // อัพโหลด background
    if (isset($_FILES['background']) && $_FILES['background']['error'] === UPLOAD_ERR_OK) {
        $background_file = $_FILES['background'];
        $background_ext = pathinfo($background_file['name'], PATHINFO_EXTENSION);
        $background_filename = uniqid() . '_background.' . $background_ext;
        $background_path = $upload_dir . $background_filename;

        if (move_uploaded_file($background_file['tmp_name'], $background_path)) {
            $updates[] = "background_path = ?";
            $params[] = $background_path;
            $types .= "s";
            // ลบไฟล์พื้นหลังเดิมออกจากเซิร์ฟเวอร์
            if (!empty($event['background_path'])) {
                unlink($event['background_path']);
            }
        }
    } else {
        error_log("Error uploading background: " . $_FILES['background']['error']);
    }

    // อัพโหลด music
    if (isset($_FILES['music']) && $_FILES['music']['error'] === UPLOAD_ERR_OK) {
        $music_file = $_FILES['music'];
        $music_ext = pathinfo($music_file['name'], PATHINFO_EXTENSION);
        $music_filename = uniqid() . '_music.' . $music_ext;
        $music_path = $upload_dir . $music_filename;

        if (move_uploaded_file($music_file['tmp_name'], $music_path)) {
            $updates[] = "music = ?";
            $params[] = $music_path;
            $types .= "s";
        }
    } else {
        error_log("Error uploading music: " . $_FILES['music']['error']);
    }

    if (!empty($updates)) {
        $sql = "UPDATE events SET " . implode(", ", $updates) . " WHERE id = ?";
        $params[] = $event_id;
        $types .= "i";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Failed to prepare statement"]);
            exit();
        }

        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Updated successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Database error: " . $stmt->error]);
        }

        $stmt->close();
    } else {
        echo json_encode(["success" => true, "message" => "No updates required"]);
    }
} else {
    // GET: ดึงข้อมูล events
    $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

    // ตรวจสอบว่า event_id ถูกส่งมา
    if (!$event_id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing or invalid event_id."]);
        exit();
    }

    // ดึงข้อมูล events
    $sqlEvent = "SELECT `id`, `name`, `background_path`, `button_color`, `text_color`, `message`, `text_button`, `status`, `music`, `created_at`, `updated_at`, `toptext_color`, `sender_color`
                 FROM `events` 
                 WHERE `id` = $event_id";
    $resultEvent = $conn->query($sqlEvent);

    // ตรวจสอบว่า event นั้นมีอยู่จริง
    if (!$resultEvent || $resultEvent->num_rows == 0) {
        http_response_code(404);
        echo json_encode(["error" => "Event not found."]);
        exit();
    }

    $event = $resultEvent->fetch_assoc();

    // แปลง path เป็น URL-friendly สำหรับ event
    $base_url = "http://127.0.0.1/Event/"; // เปลี่ยน URL ให้เหมาะสมกับเซิร์ฟเวอร์ของคุณ

    // แปลง background_path ของ event
    $path_parts = explode('Event\\', $event['background_path']);
    $filename = end($path_parts);
    $event['background_path'] = $base_url . str_replace('\\', '/', $filename); // แทนที่ \\ เป็น /

    // แปลง music ของ event
    $music_parts = explode('Event\\', $event['music']);
    $music_filename = end($music_parts);
    $event['music'] = $base_url . str_replace('\\', '/', $music_filename);

    // ดึงข้อมูล characters
    $sqlCharacters = "SELECT `id`, `image_name`, `image_path` 
                      FROM `characters` 
                      WHERE `event_id` = $event_id";
    $resultCharacters = $conn->query($sqlCharacters);

    $characters = [];
    if ($resultCharacters && $resultCharacters->num_rows > 0) {
        while ($row = $resultCharacters->fetch_assoc()) {
            $path_parts = explode('Event\\', $row['image_path']);
            $relative_path = end($path_parts);
            $row['image_path'] = $base_url . str_replace('\\', '/', $relative_path);
            $characters[] = $row;
        }
    }

    // รวมข้อมูลทั้งหมด
    $response = [
        "event" => $event,
        "characters" => $characters
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}

$conn->close();
?>
