<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

ini_set('display_errors', 1); // เปิด debug
error_reporting(E_ALL);

include('connect.php');
$conn = dbconnect();

if (!$conn) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to connect to the database."]);
    exit();
}

$sql = "SELECT id, name, background_path, type FROM background";
$result = $conn->query($sql);

$backgrounds = [];
$base_url = "http://127.0.0.1/Event/backgrounds/";

if ($result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $path_parts = explode('backgrounds\\', $row['background_path']);
            $filename = end($path_parts);
            $row['background_path'] = $base_url . $filename;
            $backgrounds[] = $row;
        }
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to execute query: " . $conn->error]);
    $conn->close();
    exit();
}

echo json_encode($backgrounds, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$conn->close();
?>
