<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

include('connect.php');
$conn = dbconnect();

if (!$conn) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to connect to the database."]);
    exit();
}

$sql = "SELECT s.id, s.image, s.user_message, s.message, s.event_name
        FROM savecartoon s
        JOIN events e ON s.event_name = e.name
        WHERE e.status = 'active'";
$result = $conn->query($sql);
$cartoons = [];

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$port = ($_SERVER['SERVER_PORT'] == 80 || $_SERVER['SERVER_PORT'] == 443) ? '' : ':' . $_SERVER['SERVER_PORT'];
$base_url = "{$protocol}://{$_SERVER['HTTP_HOST']}{$port}/Event/";

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $original_path = $row['image'];

        // ถ้าค่า image ไม่มี http ให้เติม base_url
        if (strpos($original_path, 'http') === false) {
            $row['image'] = $base_url . ltrim(str_replace('\\', '/', $original_path), '/');
        }

        $cartoons[] = $row;
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "No active characters found."]);
    $conn->close();
    exit();
}

echo json_encode($cartoons, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$conn->close();
?>
