<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
header("Content-Type: text/html; charset=UTF-8");
include('connect.php');
$conn = dbconnect();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON input."]);
        exit();
    }

    $character_id = isset($input['id']) ? intval($input['id']) : 0;

    if (!$character_id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing or invalid character_id."]);
        exit();
    }

    // ดึงข้อมูลชื่อไฟล์ที่ต้องการลบ
    $sql = "SELECT image_path FROM characters WHERE id = $character_id";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $imagePath = $row['image_path'];

        // ลบไฟล์
        if (unlink($imagePath)) {
            // ลบข้อมูลจากฐานข้อมูล
            $deleteSql = "DELETE FROM characters WHERE id = $character_id";
            if ($conn->query($deleteSql) === TRUE) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to delete character from database.']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete image file.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Character not found.']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid character ID.']);
}

$conn->close();
?>
