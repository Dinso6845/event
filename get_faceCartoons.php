<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

include('connect.php');
$conn = dbconnect();

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
if (!$conn) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to connect to the database."]);
    exit();
}

$sql = "SELECT id, name, faceImagePath FROM face_images";
$result = $conn->query($sql);

$cartoons = [];
$base_url = "http://127.0.0.1/Event/";

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // แปลง path เป็น URL ที่ถูกต้อง
        $path_parts = explode('Event\\', $row['faceImagePath']);
        $relative_path = end($path_parts);
        $row['faceImagePath'] = $base_url . str_replace('\\', '/', $relative_path);

        $cartoons[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'faceImagePath' => $row['faceImagePath']
        ];
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "No cartoons found."]);
    $conn->close();
    exit();
}

echo json_encode($cartoons, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$conn->close();
?>
