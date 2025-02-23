<?php

function dbconnect()
{
    $conn = mysqli_connect("localhost", "root", "", "event");
    $conn->set_charset("utf8mb4");
    // ตรวจสอบการเชื่อมต่อ
    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }
    return $conn;
}
$conn = dbconnect();
?>
