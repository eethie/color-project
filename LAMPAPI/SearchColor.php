<?php

$inData = getRequestInfo();

$searchResults = "";
$searchCount = 0;

$conn = new mysqli(
    "localhost",
    "TheBeast",
    "WeLoveCOP4331",
    "COP4331"
);

if ($conn->connect_error)
{
    returnWithError($conn->connect_error);
}
else
{
    $stmt = $conn->prepare(
        "SELECT Name
         FROM Colors
         WHERE Name LIKE ?
         AND UserID = ?"
    );

    $search = "%" . $inData["search"] . "%";

    $stmt->bind_param(
        "si",
        $search,
        $inData["userId"]
    );

    $stmt->execute();

    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc())
    {
        if ($searchCount > 0)
        {
            $searchResults .= ",";
        }

        $searchCount++;

        $searchResults .= '"' . $row["Name"] . '"';
    }

    $stmt->close();
    $conn->close();

    returnWithInfo($searchResults);
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
        '{"results":[],"error":"' .
        $err . '"}';

    sendResultInfoAsJson($retValue);
}


function returnWithInfo($searchResults)
{
    $retValue =
        '{"results":[' .
        $searchResults .
        '],"error":""}';

    sendResultInfoAsJson($retValue);
}

?>
