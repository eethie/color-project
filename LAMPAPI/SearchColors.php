<?php

$host = "localhost";
$user = "YOUR_DB_USER";
$password = "YOUR_DB_PASSWORD";
$database = "ContactManager";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);

    echo json_encode([
        "error" => "Database connection failed"
    ]);

    exit();
}
?>