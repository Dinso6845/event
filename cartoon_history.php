<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

include('connect.php');
$conn = dbconnect();

if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed"]));
}

// กำหนด BASE URL ของโปรเจค
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$port = ($_SERVER['SERVER_PORT'] == 80 || $_SERVER['SERVER_PORT'] == 443) ? '' : ':' . $_SERVER['SERVER_PORT'];
$base_url = "{$protocol}://{$_SERVER['HTTP_HOST']}{$port}/Event/";

// ถ้าเป็น GET ให้ดึงข้อมูล พร้อมเรียงตาม sort_order (ถ้ามี)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT `id`, `image`, `user_message`, `message`, `event_name` FROM `savecartoon` ORDER BY `sort_order` ASC";
    $result = $conn->query($sql);

    $cartoons = [];

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // ตรวจสอบว่าพาธภาพเป็น URL หรือเป็นไฟล์พาธ
            if (strpos($row['image'], 'http') === false) {
                $row['image'] = $base_url . ltrim($row['image'], '/');
            }

            $cartoons[] = $row;
        }
    }

    echo json_encode($cartoons, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// ถ้าเป็น POST ให้ตรวจสอบการอัปเดตลำดับก่อน
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // เช็คการอัปเดตลำดับ
    if (isset($_GET['update_order']) && $_GET['update_order'] == 1 && isset($data['orders']) && is_array($data['orders'])) {
        foreach ($data['orders'] as $order) {
            $id = intval($order['id']);
            $sort_order = intval($order['sort_order']);
            $sql = "UPDATE `savecartoon` SET `sort_order` = $sort_order WHERE `id` = $id";
            $conn->query($sql);
        }
        echo json_encode(["message" => "Order updated successfully"]);
        exit;
    }

    // ถ้าไม่มีการอัปเดตลำดับ ให้ตรวจสอบการลบข้อมูล
    if (!isset($data['id']) && !isset($data['ids'])) {
        echo json_encode(["error" => "No ID provided"]);
        exit;
    }

    if (isset($data['id'])) {
        $id = intval($data['id']);
        $sql = "DELETE FROM `savecartoon` WHERE `id` = $id";
    } elseif (isset($data['ids']) && is_array($data['ids'])) {
        $ids = implode(",", array_map('intval', $data['ids']));
        $sql = "DELETE FROM `savecartoon` WHERE `id` IN ($ids)";
    }

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["message" => "Cartoon(s) deleted successfully"]);
    } else {
        echo json_encode(["error" => "Error deleting cartoon: " . $conn->error]);
    }
    exit;
}

$conn->close();
?>
