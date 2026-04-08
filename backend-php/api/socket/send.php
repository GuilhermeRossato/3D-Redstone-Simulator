<?php

// get POST data as JSON and decode it
$postData = file_get_contents("php://input");
$data = json_decode($postData, true);
// e.g. {"type":"setup","playerId":"lyuqv2u3","cookieId":"10169614871110","session":"","pose":[-5.73891,2.70469,0.94856,-0.964,-0.218,0],"replyId":0}

/**
 * Generates a new player ID in PHP.
 *
 * @return string A new player ID (without the preceding 'p').
 */
function createPlayerId() {
  $expectedPlayerIdLength = 1 + 2 + 2 + 7;

  $yearDigit = substr(date("Y"), -1); // 1
  $monthPair = str_pad(date("n"), 2, "0", STR_PAD_LEFT); // 2
  $datePair = str_pad(date("j"), 2, "0", STR_PAD_LEFT); // 2
  $randomStr = strval(rand(1000000, 8999999 + 1000000)); // 7

  $id = $monthPair . $yearDigit . $randomStr . $datePair;

  if (strlen($id) !== $expectedPlayerIdLength) {
    error_log("Generated player id has invalid length: " . strlen($id) . " (expected " . $expectedPlayerIdLength . ")");
    throw new Exception("Generated player id has invalid length.");
  }

  error_log("Generated player id: " . $id);
  return $id;
}

function generateCookieId($playerId = null) {
  if (!$playerId) {
    $playerId = substr(md5(uniqid(mt_rand(), true)), 0, 8);
  }
  $yearDigit = date("Y")[3];
  $monthPair = str_pad(date("n"), 2, "0", STR_PAD_LEFT);
  $datePair = str_pad(date("j"), 2, "0", STR_PAD_LEFT);
  $randomNumber = mt_rand(1000000, 9999999);

  return $playerId[strlen($playerId) - 1] . $monthPair . $yearDigit . $randomNumber . $datePair . $playerId[0];
}

if (!is_array($data)) {
  error_log("Invalid data received: " . $postData);
  http_response_code(400);
  echo json_encode(["error" => "Invalid data format. Expected JSON object."]);
  exit;
}

if (!isset($data["playerId"])||empty($data["playerId"])) {
  error_log("Missing playerId in received");
  $data["playerId"] = createPlayerId();
}
if (!isset($data["cookieId"])||empty($data["cookieId"])) {
  error_log("Missing cookieId in received");
  $data["cookieId"] = generateCookieId();
}

setcookie("cookieId", $data["cookieId"], time() + (10 * 365 * 24 * 60 * 60), "/");

header('Content-Type: application/json');
echo json_encode(["status" => "success", "playerId" => $data["playerId"], "cookieId" => $data["cookieId"], "data" => $data]);