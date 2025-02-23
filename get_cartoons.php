<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
header("Content-Type: text/html; charset=UTF-8");

include('connect.php');
$conn = dbconnect();

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
if (!$conn) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to connect to the database."]);
    exit();
}

// Query เพื่อดึงตัวการ์ตูนที่มี event_id ตรงกับ id ของ events ที่มี status เป็น active
$sql = "SELECT characters.id, characters.event_id, characters.image_name, characters.image_path 
    FROM characters 
    JOIN events ON characters.event_id = events.id 
    WHERE events.status = 'active'";
$result = $conn->query($sql);
$characters = [];
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$port = ($_SERVER['SERVER_PORT'] == 80 || $_SERVER['SERVER_PORT'] == 443) ? '' : ':' . $_SERVER['SERVER_PORT'];
$base_url = "{$protocol}://{$_SERVER['HTTP_HOST']}{$port}/Event/";

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // แปลง path เป็น URL ที่ถูกต้อง
        $path_parts = explode('Event\\', $row['image_path']);
        $relative_path = end($path_parts);
        $row['image_path'] = $base_url . str_replace('\\', '/', $relative_path);

        $characters[] = [
            'id' => $row['id'],
            'event_id' => $row['event_id'],
            'image_name' => $row['image_name'],
            'image_path' => $row['image_path']
        ];
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "No active characters found."]);
    $conn->close();
    exit();
}

echo json_encode($characters, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$conn->close();
?>
