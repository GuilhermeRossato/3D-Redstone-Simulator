<?php

// get POST data as JSON and decode it
$postData = file_get_contents("php://input");
$data     = json_decode($postData, true);
// e.g. {"type":"setup","playerId":"lyuqv2u3","cookieId":"10169614871110","session":"","pose":[-5.73891,2.70469,0.94856,-0.964,-0.218,0],"replyId":0}
if (! is_array($data)) {
    error_log("Invalid data received: " . $postData);
    http_response_code(400);
    echo json_encode(["error" => "Invalid data format. Expected JSON object."]);
    exit;
}
if (! isset($data["type"])) {
    error_log("Missing type in received data: " . $postData);
    http_response_code(400);
    echo json_encode(["error" => "Missing type field in data."]);
    exit;
}
if (! is_array($data)) {
    error_log("Data is not an array: " . $postData);
    http_response_code(400);
    echo json_encode(["error" => "Invalid data format. Expected JSON object."]);
    exit;
}
if (isset($_GET["playerId"])) {
    $data["playerId"] = $_GET["playerId"];
}
if (isset($_GET["cookieId"]) && (! isset($data["cookieId"]) || empty($data["cookieId"]))) {
    $data["cookieId"] = $_GET["cookieId"];
}
error_log("Received packet of type \"" . $data["type"] . "\" with player id " . ($data["playerId"] ?? "unknown") . " and cookie id " . ($data["cookieId"] ?? "unknown"));
if ($data["type"] === "setup") {
    require_once __DIR__ . "/../../lib/packets/setup.php";
    $obj = handleSetupPacket($data);
    header('Content-Type: application/json');
    echo json_encode($obj);
} elseif ($data["type"] === "context") {
    require_once __DIR__ . "/../../lib/packets/context.php";
    $obj = handleContextPacket($data);
    header('Content-Type: application/json');
    echo json_encode($obj);
} elseif ($data["type"] === "sync") {
    require_once __DIR__ . "/../../lib/packets/sync.php";
    $obj = handleSyncPacket($data);
    header('Content-Type: application/json');
    echo json_encode($obj);
} elseif ($data["type"] === "spawn") {
    require_once __DIR__ . "/../../lib/packets/spawn.php";
    $obj = handleSpawnPacket($data);
    header('Content-Type: application/json');
    echo json_encode($obj);
} elseif ($data["type"] === "move") {
    require_once __DIR__ . "/../../lib/packets/move.php";
    $obj = handleMovePacket($data);
    header('Content-Type: application/json');
    echo json_encode($obj);
} else {
    error_log("Unknown packet type received: " . $data["type"]);
    http_response_code(400);
    echo json_encode(["error" => "Unknown packet type: " . $data["type"]]);
    exit;
}
