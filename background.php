<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
header("Content-Type: text/html; charset=UTF-8");

ini_set('display_errors', 1); 
error_reporting(E_ALL);

include('connect.php');
$conn = dbconnect();

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
if (!$conn) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to connect to the database."]);
    exit();
}

// เพิ่มเงื่อนไขในการ query เพื่อดึงเฉพาะแถวที่มี status เป็น active
$sql = "SELECT id, name, background_path, button_color, text_color, message, text_button, status, music, created_at, updated_at, sender_color, toptext_color, set_cartoon
        FROM events 
        WHERE status = 'active'";
$result = $conn->query($sql);

// กรณีไม่พบผลลัพธ์จากการ query
if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to execute query: " . $conn->error]);
    $conn->close();
    exit();
}

$backgrounds = [];
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$port = ($_SERVER['SERVER_PORT'] == 80 || $_SERVER['SERVER_PORT'] == 443) ? '' : ':' . $_SERVER['SERVER_PORT'];
$base_url = "{$protocol}://{$_SERVER['HTTP_HOST']}{$port}/Event/";

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // แปลง path ให้รองรับการแสดงผล URL
        $path_parts = explode('Event\\', $row['background_path']);
        $filename = end($path_parts);
        $row['background_path'] = $base_url . str_replace('\\', '/', $filename); // แทนที่ \\ เป็น /

        if (!empty($row['music'])) { // ตรวจสอบว่ามีข้อมูลเพลง
            $music_parts = explode('Event\\', $row['music']);
            $music_filename = end($music_parts);
            $row['music'] = $base_url . str_replace('\\', '/', $music_filename); // แทนที่ \\ เป็น /
        } else {
            $row['music'] = null; 
        }

        $backgrounds[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'background_path' => $row['background_path'],
            'music' => $row['music'],
            'button_color' => $row['button_color'],
            'text_color' => $row['text_color'],
            'message' => $row['message'],
            'text_button' => $row['text_button'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'toptext_color' => $row['toptext_color'],
            'sender_color' => $row['sender_color'],
            'set_cartoon' => $row['set_cartoon']
        ];
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "No active backgrounds found."]);
    $conn->close();
    exit();
}

echo json_encode($backgrounds, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$conn->close();
?>
