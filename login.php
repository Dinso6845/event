<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
header("Content-Type: text/html; charset=UTF-8");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// เชื่อมต่อฐานข้อมูล
include('connect.php');
$conn = dbconnect();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($data) {
        if (isset($data['username']) && isset($data['password'])) {
            $username = $data['username'];
            $password = $data['password'];

            // ตรวจสอบข้อมูลในฐานข้อมูล
            $query = "SELECT `am_id`, `am_user`, `am_password` FROM `admin` WHERE `am_user` = ?";
            $stmt = $conn->prepare($query);

            if ($stmt === false) {
                die(json_encode(['status' => 'error', 'message' => 'MySQL prepare error: ' . $conn->error]));
            }

            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();

                // ตรวจสอบรหัสผ่าน
                if ($password == $row['am_password']) {
                    $_SESSION['admin_id'] = $row['am_id'];
                    $_SESSION['admin_user'] = $row['am_user'];
                    echo json_encode(['status' => 'success', 'message' => 'Login successful']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Invalid username or password']);
                }
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid username or password']);
            }

            $stmt->close();
            $conn->close();
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Please fill in both fields']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No data received']);
    }
}
?>
