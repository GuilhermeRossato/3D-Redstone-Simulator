<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/chunk_storage.php";
require_once __DIR__ . "/../database/region_storage.php";

function handleMovePacket($data)
{
    // Validate required fields
    if (! isset($data['pose'])) {
        error_log("Invalid move packet: Missing pose. Data: " . json_encode($data));
        return ["error" => "Invalid move packet: Missing pose."];
    }
    $event = [
        "type"      => "move",
        "timestamp" => time(),
        "playerId"  => $data['playerId'] ?? "",
        "entityId"  => $data['entityId'] ?? "",
        "regionId"  => $data["regionId"] ?? "",
        "pose"      => $data["pose"] ?? [0, 0, 0, 0, 0, 0],
    ];
    if (isset($data['entityId'])) {
        if (isset($data['playerId']) && ! isset($data['regionId'])) {
            $player = isset($data['playerId']) ? getActivePlayer($data["playerId"]) : null;
            if (! $player) {
                error_log("Invalid player in move packet: " . json_encode($data));
                return [
                    'error' => 'Invalid player id.',
                ];
            }
            $event["regionId"] = getRegionIdFromPos($player["pose"] ?? [0, 0, 0]);
        } else if (! isset($data['regionId'])) {
            error_log("Invalid move packet: Missing regionId for entity move. Data: " . json_encode($data));
            return ["error" => "Invalid move packet: Missing regionId for entity move."];
        }
        if (! isset($event['regionId'])) {
            $event['regionId'] = getRegionIdFromPos($data['pose']);
        }
        applyRegionEntityPoseUpdate($data['regionId'], $data['entityId'], $data['pose']);
        $nextRegion = getRegionIdFromPos($data["pose"]);

        if (! isset($data["playerId"]) && isset($entity["playerId"])) {
            $event["playerId"] = $entity["playerId"];
        }
        if ($nextRegion && $data["regionId"] !== $nextRegion) {
            $event["nextRegion"] = $nextRegion;
        }
    }

    appendRegionEvent($event);
    broadCastRegionEvents($event);
    return ["success" => true];
}
