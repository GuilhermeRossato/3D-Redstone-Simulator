<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/region_storage.php";

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
        return ["error" => "Invalid cookieId format. Expected to start with 'c'"];
    }
    setcookie("cookieId", $data["cookieId"], time() + (10 * 365 * 24 * 60 * 60), "/");
    $player = loadPlayer($data["playerId"], null);
    $type   = "unknown";
    if (! $player) {
        $type = "created-player";
        error_log("Player not found, creating id: " . $data["playerId"]);
        $playerData = [
            "playerId"    => $data["playerId"],
            "cookieId"    => $data["cookieId"],
            "createdAt"   => time(),
            "lastLoginAt" => time(),
            "pose"        => $data["pose"] ?? [0, 0, 0, 0, 0, 0],
        ];
        if (abs($playerData["pose"][0]) < 0.5 && abs($playerData["pose"][1]) < 0.5 && abs($playerData["pose"][2]) < 0.5) {
            error_log("Player pose is at origin, moving to spawn point.");
            $playerData["pose"][0] = 8;
            $playerData["pose"][1] = 8;
            $playerData["pose"][2] = 8;
            $playerData["pose"][3] = 0;
            $playerData["pose"][4] = -1;
            $playerData["pose"][5] = 0;
        }
        createPlayer($data["playerId"], $playerData);
    } else {
        $type = "existing-player";
        error_log("Player found: " . $data["playerId"]);
        $player["lastLoginAt"] = time();
        if (!array_key_exists("loginCount", $player)) {
            $player["loginCount"] = 1;
        } else {
            $player["loginCount"] += 1;
        }
        $player["pose"]        = $data["pose"] ?? $player["pose"] ?? [0, 0, 0, 0, 0, 0];
        savePlayer($data["playerId"], $player);
    }
    $player = loadPlayer($data["playerId"], null);

    setActivePlayer($data["playerId"], $player);
    $player = getActivePlayer($data["playerId"]);
    if (! $player) {
        error_log("Failed to retrieve player from cache after setting it: " . $data["playerId"]);
        return ["error" => "Failed to retrieve player from cache after setting it.", "playerId" => $data["playerId"]];
    }
    $region     = getRegionIdFromPos($player["pose"]);
    $regionData = loadRegion($region);
    if (! $regionData) {
        error_log("Failed to load region data for region: " . $region);
        saveRegion($region, ["regionId" => $region, "createdAt" => time(), "entities" => []]);
        $regionData = loadRegion($region);
    }
    if (! $regionData) {
        error_log("Failed to retrieve region data after creating it: " . $region);
        return ["error" => "Failed to retrieve region data after creating it.", "regionId" => $region];
    }
    if (! is_array($regionData["entities"])) {
        $regionData["entities"] = [];
        saveRegion($region, $regionData);
    }
    return (["status" => "success", "type" => $type, "playerId" => $data["playerId"], "cookieId" => $data["cookieId"], "region" => $region]);
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
