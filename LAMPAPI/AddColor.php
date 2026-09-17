<?php

$inData = getRequestInfo();

$env = loadEnv(__DIR__ . '/.env');
 
$conn = new mysqli(
    $env["DB_HOST"],
    $env["DB_USER"],
    $env["DB_PASS"],
    $env["DB_NAME"]
);


if ($conn->connect_error)
{
    returnWithError($conn->connect_error);
}
else
{
    $stmt = $conn->prepare(
        "INSERT INTO Colors (Name, UserID)
         VALUES (?, ?)"
    );

    $stmt->bind_param(
        "si",
        $inData["color"],
        $inData["userId"]
    );

    $stmt->execute();

    $stmt->close();
    $conn->close();

    returnWithError("");
}


function getRequestInfo()
{
    return json_decode(
        file_get_contents("php://input"),
        true
    );
}


function sendResultInfoAsJson($obj)
{
    header("Content-type: application/json");
    echo $obj;
}


function returnWithError($err)
{
    $retValue = '{"error":"' . $err . '"}';

    sendResultInfoAsJson($retValue);
}

?>
