<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
header("Content-Type: text/html; charset=UTF-8");

ini_set('display_errors', 1);
error_reporting(E_ALL);

include('connect.php');
$conn = dbconnect(); 

// ดึงคำต้องห้าม
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $result = $conn->query("SELECT word FROM banned_words");
    $bannedWords = [];
    while ($row = $result->fetch_assoc()) {
        $bannedWords[] = $row['word'];
    }
    echo json_encode($bannedWords);
    exit;
}

// เพิ่มคำต้องห้าม
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!empty($data["word"])) {
        $word = trim($data["word"]);

        // ใช้ Prepared Statement
        $stmt = $conn->prepare("INSERT INTO banned_words (word) VALUES (?)");
        $stmt->bind_param("s", $word);

        if ($stmt->execute()) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "เพิ่มข้อมูลล้มเหลว: " . $conn->error]);
        }

        $stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "ไม่มีคำที่เพิ่ม"]);
    }
    exit;
}

// ลบคำต้องห้าม
if ($_SERVER["REQUEST_METHOD"] == "DELETE") {
    header('Content-Type: application/json'); // ใส่ก่อน echo JSON

    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!empty($data["word"])) {
        $word = $conn->real_escape_string($data["word"]);

        // ใช้ Prepared Statement
        $stmt = $conn->prepare("DELETE FROM banned_words WHERE word = ?");
        $stmt->bind_param("s", $word);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            // echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "ไม่พบคำต้องห้าม"]);
        }

        $stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "ไม่มีคำที่ลบ"]);
    }
    exit;
}
?>
