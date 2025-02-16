<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

include('connect.php');
$conn = dbconnect();

// รองรับ preflight request (OPTIONS method)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // ไม่มีเนื้อหา แต่อนุญาต
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // ดึงข้อมูลเทศกาลตาม ID
            $stmt = $conn->prepare("SELECT `id`, `name`, `status` FROM `events` WHERE id = ?");
            $stmt->bind_param("i", $_GET['id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $event = $result->fetch_assoc();
            echo json_encode($event);
        } else {
            // ดึงข้อมูลทั้งหมด
            $result = $conn->query("SELECT `id`, `name`, `status` FROM `events` WHERE 1");
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $events[] = $row;
            }
            echo json_encode($events);
        }
        break;

    case 'POST':
        // เพิ่มข้อมูลใหม่
        $input = json_decode(file_get_contents("php://input"), true);

        // Debug: Log ข้อมูลที่รับเข้ามา
        error_log("Received POST Data: " . json_encode($input));
        
        if (isset($input['name'], $input['status'])) {
            $stmt = $conn->prepare("INSERT INTO `events` (`name`, `status`) VALUES (?, ?)");
            $stmt->bind_param("ss", $input['name'], $input['status']);
            if ($stmt->execute()) {
                echo json_encode(['message' => 'Event added successfully']);
            } else {
                echo json_encode(['error' => 'Failed to add event']);
            }
            $stmt->close();
        } else {
            echo json_encode(['error' => 'Invalid input']);
        }
        break;

    case 'PUT':
        // แก้ไขข้อมูลและเปลี่ยนสถานะ
        $input = json_decode(file_get_contents("php://input"), true);
        if (isset($input['id'], $input['name'], $input['status'])) {
            $stmt = $conn->prepare("UPDATE `events` SET `name` = ?, `status` = ? WHERE `id` = ?");
            $stmt->bind_param("ssi", $input['name'], $input['status'], $input['id']);
            if ($stmt->execute()) {
                echo json_encode(['message' => 'Event updated successfully']);
            } else {
                echo json_encode(['error' => 'Failed to update event']);
            }
            $stmt->close();
        } else {
            echo json_encode(['error' => 'Invalid input']);
        }
        break;

    case 'DELETE':
        // ลบข้อมูล
        $input = json_decode(file_get_contents("php://input"), true);
        if (isset($input['id'])) {
            $stmt = $conn->prepare("DELETE FROM `events` WHERE `id` = ?");
            $stmt->bind_param("i", $input['id']);
            if ($stmt->execute()) {
                echo json_encode(['message' => 'Event deleted successfully']);
            } else {
                echo json_encode(['error' => 'Failed to delete event']);
            }
            $stmt->close();
        } else {
            echo json_encode(['error' => 'Invalid input']);
        }
        break;

    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

$conn->close();
?>
