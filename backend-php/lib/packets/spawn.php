<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/chunk_storage.php";
require_once __DIR__ . "/../database/region_storage.php";
require_once __DIR__ . "/../database/active_players.php";

function handleSpawnPacket($data)
{
    $pid = isset($data['playerId']) ? $data['playerId'] : null;

    $list          = getFastActivePlayer(false);
    $playerObj     = null;
    $otherListList = [];
    foreach ($list as $activePlayer) {
      error_log("Checking active player in spawn packet: " . json_encode($activePlayer));
        if ($activePlayer["playerId"] === $pid) {
            $playerObj = $activePlayer;
        } else if (isset($activePlayer["queue"]) && is_array($activePlayer["queue"])) {
            $otherListList[] = $activePlayer["queue"];
        }
    }

    if (! $playerObj) {
        error_log("Invalid player in spawn packet: " . json_encode($data));
        return [
            'error' => 'Missing required fields: playerId or pose.',
        ];
    }
    if (isset($data["pose"]) && is_array($data["pose"]) && count($data["pose"]) === 6) {
        error_log("Updating player pose for spawn packet: " . json_encode($data["pose"]));
        $playerObj["pose"] = $data["pose"];
    } else {
        error_log("Using player pose from active player data for spawn packet because no valid pose was provided: " . json_encode($playerObj["pose"]));
    }
    $regionId = getRegionIdFromPos($playerObj["pose"]);

    $entityObj = [
        "type"      => "player",
        "entityId"  => uniqid("e"),
        "playerId"  => $pid,
        "createdAt" => time(),
        "regionId"  => $regionId,
        "pose"      => $playerObj["pose"],
    ];
    $evt = [
        "type"      => "spawn",
        "timestamp" => time(),
        "playerId"  => $pid,
        "entityId"  => $entityObj["entityId"],
        "regionId"  => $regionId,
        "entity"    => $entityObj,
    ];
    foreach ($otherListList as $otherList) {
        array_push($otherList, $evt);
    }
    setFastActivePlayer($list, false);
    $playerObj["entityId"] = $entityObj["entityId"];
    $playerObj["entity"] = $entityObj;
    return [
        "status"   => "success",
        "entity"   => $entityObj,
        "player"   => $playerObj,
        "regionId" => $regionId,
    ];
}
