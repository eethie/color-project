<?php

$inData = getRequestInfo();

$id = 0;
$firstName = "";
$lastName = "";

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
        "SELECT ID, FirstName, LastName
         FROM Users
         WHERE Login=? AND Password=?"
    );

    $stmt->bind_param(
        "ss",
        $inData["login"],
        $inData["password"]
    );

    $stmt->execute();

    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc())
    {
        $firstName = $row["FirstName"];
        $lastName = $row["LastName"];
        $id = $row["ID"];
    }

    $stmt->close();
    $conn->close();

    if ($id == 0)
    {
        returnWithError("No Records Found");
    }
    else
    {
        returnWithInfo(
            $firstName,
            $lastName,
            $id
        );
    }
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
    $retValue =
        '{"id":0,"firstName":"","lastName":"","error":"' .
        $err . '"}';

    sendResultInfoAsJson($retValue);
}


function returnWithInfo($firstName, $lastName, $id)
{
    $retValue =
        '{"id":' . $id .
        ',"firstName":"' . $firstName .
        '","lastName":"' . $lastName .
        '","error":""}';

    sendResultInfoAsJson($retValue);
}

?>
