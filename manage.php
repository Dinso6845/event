<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
header("Content-Type: text/html; charset=UTF-8");

include('connect.php');
$conn = dbconnect();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("SELECT `id`, `name`, `status` FROM `events` WHERE id = ?");
            $stmt->bind_param("i", $_GET['id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $event = $result->fetch_assoc();
            echo json_encode($event);
        } else {
            $result = $conn->query("SELECT `id`, `name`, `status` FROM `events` WHERE 1");
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $events[] = $row;
            }
            echo json_encode($events);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents("php://input"), true);
        error_log("Received POST Data: " . json_encode($input));
        
        if (isset($input['name'], $input['status'])) {
            // ถ้าสถานะเป็น active ให้ทำให้ข้อมูลอื่นทั้งหมดเป็น inactive ก่อน
            if ($input['status'] === 'active') {
                $conn->query("UPDATE `events` SET `status` = 'inactive'");
            }
            
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
        $input = json_decode(file_get_contents("php://input"), true);
        if (isset($input['id'], $input['status'])) {
            if (!is_numeric($input['id']) || !in_array($input['status'], ['active', 'inactive'])) {
                echo json_encode(['error' => 'Invalid input']);
                exit();
            }                
               // ถ้าสถานะใหม่เป็น active ให้ทำให้ข้อมูลอื่นทั้งหมดเป็น inactive ก่อน
            if ($input['status'] === 'active') {
                $conn->query("UPDATE `events` SET `status` = 'inactive' WHERE id != " . intval($input['id']));
            }
                $stmt = $conn->prepare("UPDATE `events` SET `status` = ? WHERE `id` = ?");
                $stmt->bind_param("si", $input['status'], $input['id']);
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
