<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/chunk_storage.php";
require_once __DIR__ . "/../database/region_storage.php";
require_once __DIR__ . "/../database/active_players.php";

function handleMovePacket($data)
{
    // Validate required fields
    if (! isset($data['pose'])) {
        error_log("Invalid move packet: Missing pose. Data: " . json_encode($data));
        return ["error" => "Invalid move packet: Missing pose."];
    }
    $pid = isset($data['playerId']) ? $data['playerId'] : null;

    $selfQueue     = [];
    $list          = getFastActivePlayer(false);
    $playerObj     = null;
    $otherListList = [];
    foreach ($list as $activePlayer) {
        error_log("Checking active player in spawn packet: " . json_encode($activePlayer));
        if (! isset($activePlayer["queue"]) || ! is_array($activePlayer["queue"])) {
            $activePlayer["queue"] = [];
        }
        if ($activePlayer["playerId"] == $pid) {
          error_log("Found active player for move packet: " . json_encode($activePlayer));
            $playerObj = true;
            foreach ($activePlayer["queue"] as $evt) {
                array_push($selfQueue, $evt);
            }
            $activePlayer["queue"] = [];
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
    if (! isset($data['entityId'])) {
        return ["error" => "Invalid move packet: Missing entityId."];
    }

    $evt = [
        "type"      => "move",
        "timestamp" => time(),
        "playerId"  => $pid ?? "",
        "entityId"  => $data['entityId'] ?? "",
        "regionId"  => $data["regionId"] ?? "",
        "pose"      => $data["pose"] ?? [0, 0, 0, 0, 0, 0],
    ];
    foreach ($otherListList as $otherList) {
        array_push($otherList, $evt);
    }
    setFastActivePlayer($list, false);

    return ["success" => true, "events" => $selfQueue];
}
