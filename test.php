<?php
header('Access-Control-Allow-Origin: http://127.0.0.1:5000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include('connect.php');
$conn = dbconnect();

// รับค่า id จาก URL parameter
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// ตรวจสอบว่ามีการส่ง id มาหรือไม่
if ($id <= 0) {
    echo json_encode(["message" => "Invalid or missing ID parameter."]);
    exit;
}

$base_url = "http://127.0.0.1/Event/"; // URL ของเว็บที่คุณต้องการใช้งาน

// เช็คว่า id ในตาราง events มีค่าเท่ากับ $id หรือไม่
$sql_check_event = "SELECT id FROM events WHERE id = ?";
$stmt_check_event = $conn->prepare($sql_check_event);
$stmt_check_event->bind_param("i", $id);
$stmt_check_event->execute();
$result_event = $stmt_check_event->get_result();

if ($result_event->num_rows > 0) {
    // เช็คว่า event_id ในตาราง characters มีค่าเท่ากับ $id หรือไม่
    $sql = "
        SELECT e.id AS event_id,
               c.id AS character_id, c.image_name, c.image_path
        FROM events e
        INNER JOIN characters c ON e.id = c.event_id
        WHERE e.id = ?;
    ";

    // เตรียมคำสั่ง SQL
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    // เรียกใช้งานคำสั่ง SQL
    $stmt->execute();

    // รับผลลัพธ์
    $result = $stmt->get_result();

    // เช็คผลลัพธ์
    if ($result->num_rows > 0) {
        $data = [];
        while ($row = $result->fetch_assoc()) {
            // แยก image_path และแทนที่ \\ ด้วย /
            $path_parts = explode('Event\\', $row['image_path']);
            $relative_path = end($path_parts);
            $row['image_path'] = $base_url . str_replace('\\', '/', $relative_path);

            // เพิ่มข้อมูลลงใน array
            $data[] = $row;
        }
        echo json_encode($data);
    } else {
        echo json_encode(["message" => "No characters found for the event."]);
    }

    // การ Insert ข้อมูลใหม่เข้าไปในตาราง characters
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // รับข้อมูลจากผู้ใช้
        $image_name = $_POST['image_name'];
        $image_file = $_FILES['image_file'];

        // ตรวจสอบว่าข้อมูลที่ต้องการใส่มีหรือไม่
        if (empty($image_name) || empty($image_file)) {
            echo json_encode(["message" => "Image name and image file are required."]);
            exit;
        }

        // สร้างโฟลเดอร์สำหรับเก็บไฟล์ (ถ้ายังไม่มี)
        $upload_dir = "uploads/";
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        // สร้างชื่อไฟล์ใหม่เพื่อป้องกันการซ้ำ
        $file_extension = pathinfo($image_file['name'], PATHINFO_EXTENSION);
        $new_filename = uniqid() . '.' . $file_extension;
        $upload_path = $upload_dir . $new_filename;

        // อัพโหลดไฟล์
        if (move_uploaded_file($image_file['tmp_name'], $upload_path)) {
            // คำสั่ง SQL สำหรับการ insert ข้อมูล
            $sql_insert = "INSERT INTO characters (event_id, image_name, image_path) VALUES (?, ?, ?)";
            $stmt_insert = $conn->prepare($sql_insert);
            $stmt_insert->bind_param("iss", $id, $image_name, $upload_path);

            // ถ้าเพิ่มข้อมูลสำเร็จ
            if ($stmt_insert->execute()) {
                echo json_encode(["message" => "Character added successfully."]);
            } else {
                echo json_encode(["message" => "Failed to add character."]);
            }

            $stmt_insert->close();
        } else {
            echo json_encode(["message" => "Failed to upload file."]);
        }
    }

    // ปิดการเชื่อมต่อ
    $stmt->close();
} else {
    echo json_encode(["message" => "Event not found."]);
}

$conn->close();
?>

