<?php

require_once __DIR__ . "/database/player_storage.php";

function handleSetupPacket($data)
{
    if (! isset($data["playerId"]) || empty($data["playerId"])) {
        error_log("Missing playerId in received");
        $data["playerId"] = createPlayerId();
    }
    if (! isset($data["cookieId"]) || empty($data["cookieId"])) {
        error_log("Missing cookieId in received");
        $data["cookieId"] = generateCookieId();
    }
    if ($data["playerId"][0] !== "p") {
        error_log("Invalid playerId format: " . $data["playerId"]);
        http_response_code(400);
        return ["error" => "Invalid playerId format. Expected to start with 'p'."];
    }
    if ($data["cookieId"][0] !== "c") {
        error_log("Invalid cookieId format: " . $data["cookieId"]);
        http_response_code(400);
        return ["error" => "Invalid cookieId format. Expected to start with 'c'", ];
    }
    setcookie("cookieId", $data["cookieId"], time() + (10 * 365 * 24 * 60 * 60), "/");
    $player = loadPlayer($data["playerId"], null);
    if (! $player) {
        error_log("Player not found, creating new player with id: " . $data["playerId"]);
        $playerData = [
            "playerId"  => $data["playerId"],
            "cookieId"  => $data["cookieId"],
            "created"   => time(),
            "lastLogin" => time(),
        ];
        $player = createPlayer($data["playerId"], $playerData);
    } else {
        error_log("Player found: " . $data["playerId"]);
    }
    header('Content-Type: application/json');
    setPlayerCache($data["playerId"], $player);
    return (["status" => "success", "playerId" => $data["playerId"], "cookieId" => $data["cookieId"], "data" => $data]);
}

/**
 * Generates a new player ID in PHP.
 *
 * @return string A new player ID (without the preceding 'p').
 */
function createPlayerId()
{
    $expectedPlayerIdLength = 1 + 2 + 2 + 7;

    $yearDigit = substr(date("Y"), -1);                    // 1
    $monthPair = str_pad(date("n"), 2, "0", STR_PAD_LEFT); // 2
    $datePair  = str_pad(date("j"), 2, "0", STR_PAD_LEFT); // 2
    $randomStr = strval(rand(1000000, 8999999 + 1000000)); // 7

    $id = $monthPair . $yearDigit . $randomStr . $datePair;

    if (strlen($id) !== $expectedPlayerIdLength) {
        error_log("Generated player id has invalid length: " . strlen($id) . " (expected " . $expectedPlayerIdLength . ")");
        throw new Exception("Generated player id has invalid length.");
    }

    error_log("Generated player id: " . $id);
    return 'p' . $id;
}

function generateCookieId($playerId = null)
{
    if (! $playerId) {
        $playerId = substr(md5(uniqid(mt_rand(), true)), 0, 8);
    }
    $yearDigit    = date("Y")[3];
    $monthPair    = str_pad(date("n"), 2, "0", STR_PAD_LEFT);
    $datePair     = str_pad(date("j"), 2, "0", STR_PAD_LEFT);
    $randomNumber = mt_rand(1000000, 9999999);

    return 'c' . $playerId[strlen($playerId) - 1] . $monthPair . $yearDigit . $randomNumber . $datePair . $playerId[0];
}
