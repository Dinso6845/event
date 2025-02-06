<!-- <?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

ini_set('display_errors', 1); // เปิด debug
error_reporting(E_ALL);

include('connect.php');
$conn = dbconnect();

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
if (!$conn) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to connect to the database."]);
    exit();
}

$event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

// ตรวจสอบว่า event_id ถูกส่งมา
if (!$event_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid event_id."]);
    exit();
}

// ดึงข้อมูล events
$sqlEvent = "SELECT `id`, `name`, `background_path`, `button_color`, `text_color`, `message`, `text_botton`, `status`, `music`, `created_at`, `updated_at` 
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
$base_url = "http://127.0.0.1/Event/";

// แปลง background_path ของ event
$path_parts = explode('Event\\', $event['background_path']);
$filename = end($path_parts);
$event['background_path'] = $base_url . str_replace('\\', '/', $filename); // แทนที่ \\ เป็น /

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
$conn->close();
?> -->
