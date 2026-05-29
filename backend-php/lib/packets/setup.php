<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/region_storage.php";
require_once __DIR__ . "/../database/active_players.php";

function handleSetupPacket($data)
{
    $pid = isset($data['playerId']) ? $data['playerId'] : null;
    if (! isset($pid) || ! $pid || empty($pid)) {
        error_log("Missing playerId in received");
        $pid = createPlayerId();
    }
    if (! isset($data["cookieId"]) || empty($data["cookieId"])) {
        error_log("Missing cookieId in received");
        $data["cookieId"] = generateCookieId();
    }
    if ($pid[0] !== "p") {
        error_log("Invalid playerId format: " . $pid);
        http_response_code(400);
        return ["error" => "Invalid playerId format. Expected to start with 'p'."];
    }
    if ($data["cookieId"][0] !== "c") {
        error_log("Invalid cookieId format: " . $data["cookieId"]);
        http_response_code(400);
        return ["error" => "Invalid cookieId format. Expected to start with 'c'"];
    }
    setcookie("cookieId", $data["cookieId"], time() + (10 * 365 * 24 * 60 * 60), "/");
    $player = loadPlayer($pid, null);
    $type   = "unknown";
    if (! $player) {
        $type = "created-player";
        error_log("Player not found, creating id: " . $pid);
        $playerData = [
            "playerId"    => $pid,
            "cookieId"    => $data["cookieId"],
            "createdAt"   => time(),
            "lastLoginAt" => time(),
            "regionList"  => [],
            "profileList" => [],
            "pose"        => $data["pose"] ?? [0, 0, 0, 0, 0, 0],
        ];
        createPlayer($pid, $playerData);
    } else {
        $type = "existing-player";
        error_log("Player found: " . $pid);
        $player["lastLoginAt"] = time();
        if (! array_key_exists("loginCount", $player)) {
            $player["loginCount"] = 1;
        } else {
            $player["loginCount"] += 1;
        }
        savePlayer($pid, $player);
    }
    $player          = loadPlayer($pid, null);
    $list            = getFastActivePlayer(false);
    $activePlayerObj = null;
    foreach ($list as $activePlayer) {
        if ($activePlayer["playerId"] === $pid) {
            error_log("Player " . $pid . " is already active, skipping adding to active players list.");
            $activePlayerObj = $activePlayer;
            break;
        }
    }
    if (! $activePlayerObj) {
        $activePlayerObj = [
            "playerId"    => $pid,
            "entityId" => null,
            "pose"        => [0, 0, 0, 0, 0, 0],
            "lastLoginAt" => 0,
            "queue"       => [],
        ];
        array_push($list, $activePlayerObj);
    }
    $activePlayerObj["pose"]        = $player["pose"];
    $activePlayerObj["lastLoginAt"] = time();
    setFastActivePlayer($list, false);
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
    return (["status" => "success", "type" => $type, "playerId" => $pid, "cookieId" => $data["cookieId"], "region" => $region]);
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
