<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/chunk_storage.php";
require_once __DIR__ . "/../database/region_storage.php";

function handleSpawnPacket($data)
{
    $player = isset($data['playerId']) ? getActivePlayer($data["playerId"]) : null;
    if (! $player) {
        error_log("Invalid player in spawn packet: " . json_encode($data));
        return [
            'error' => 'Missing required fields: playerId or pose.',
        ];
    }
    if (isset($data["pose"]) && is_array($data["pose"]) && count($data["pose"]) === 6) {
        $player["pose"] = $data["pose"];
        setActivePlayer($data["playerId"], $player);
        savePlayer($data["playerId"], $player);
    } else {
        error_log("Using existing player pose for spawn packet due to missing or invalid pose data: " . json_encode($data));
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
    }
    $lastEntityId = false;
    $extra        = [];
    $regionEntities         = [];
    $entityId     = $extra["entityId"] ?? uniqid("e");
    $entity       = [
        "type"      => "player",
        "entityId"  => $entityId,
        "playerId"  => $data["playerId"],
        "createdAt" => time(),
        "regionId"  => $region,
        "pose"      => $player["pose"],
    ];
    foreach ($regionData["entities"] as $entity) {
        if (isset($entity["playerId"]) && $entity["playerId"] === $data["playerId"] && $entity["type"] === "player") {
            $lastEntityId = $entity["entityId"];
            foreach ($entity as $key => $value) {
                if (! array_key_exists($key, $regionEntities)) {
                    $regionEntities[$key] = $value;
                }
            }
            continue;
        }
        array_push($regionEntities, $entity);
    }
    foreach ($extra as $key => $value) {
        if (! array_key_exists($key, $entity)) {
            $entity[$key] = $value;
        }
    }
    $events = [];
    if ($lastEntityId) {
        array_push($events, [
            "type"      => "despawn",
            "timestamp" => time(),
            "playerId"  => $data["playerId"],
            "entityId"  => $lastEntityId,
            "regionId"  => $region,
        ]);
        appendRegionEvent($events[0]);
    }
    $evt = [
        "type"      => "spawn",
        "timestamp" => time(),
        "playerId"  => $data["playerId"],
        "entityId"  => $entityId,
        "regionId"  => $region,
        "entity"    => $entity,
    ];
    array_push($events, $evt);
    appendRegionEvent($evt);
    $regionData["entities"] = $regionEntities;
    if (!array_key_exists("lastDirtyTimestamp", $regionData)) {
        $regionData["lastDirtyTimestamp"] = time();
    }
    $player["entityId"] = $entityId;
    $player["entityId"] = $entityId;
    $player["pose"] = $entity["pose"];
    setActivePlayer($data["playerId"], $player);
    savePlayer($data["playerId"], $player);
    broadCastRegionEvents($events);
    return [
        "status"   => "success",
        "entity"   => $entity,
        "player"   => $player,
        "regionId" => $region,
    ];
}
