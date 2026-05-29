<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/chunk_storage.php";
require_once __DIR__ . "/../database/region_storage.php";

function handlePlacePacket($data)
{
    $playerId = $data['playerId'] ?? null;
    $x        = $data['x'] ?? null;
    $y        = $data['y'] ?? null;
    $z        = $data['z'] ?? null;
    $blockId  = $data['bid'] ?? $data['blockId'] ?? $data['id'] ?? null;

    if ($playerId === null || ! is_numeric($x) || ! is_numeric($y) || ! is_numeric($z) || $blockId === null) {
        error_log("Invalid place packet, missing or invalid fields: " . json_encode($data));
        return ['error' => 'Missing or invalid required fields.'];
    }

    $player = getActivePlayer($playerId);

    if (! $player) {
        error_log("Inactive player attempted to place block: " . $playerId);
        return ['error' => 'Player not found or inactive.', "playerId" => $playerId];
    }

    if (! isset($player['pose']) || ! is_array($player['pose']) || count($player['pose']) < 3) {
        error_log("Player has no valid pose: " . $playerId);
        return ['error' => 'Player has no valid pose.'];
    }

    $targetPos = [$x, $y, $z];
    $playerPos = $player['pose'];

    $distance = sqrt(
        pow($playerPos[0] - $targetPos[0], 2) +
        pow($playerPos[1] - $targetPos[1], 2) +
        pow($playerPos[2] - $targetPos[2], 2)
    );

    if ($distance > 32) {
        error_log("Player " . $playerId . " is too far to place block. Distance: " . $distance);
        return ['error' => 'You are too far to place a block.', "distance" => $distance, "pose" => $playerPos];
    }

    $chunkId    = getChunkIdFromPos($targetPos);
    $regionId   = getRegionIdFromPos($targetPos);
    $regionData = loadRegion($regionId);

    if (! $regionData) {
        error_log("Region " . $regionId . " does not exist. Creating it.");
        saveRegion($regionId, ["regionId" => $regionId, "createdAt" => time(), "entities" => []]);
        $regionData = loadRegion($regionId);
        if (! $regionData) {
            error_log("Failed to create/load region for place packet: " . $regionId);
            return ['error' => 'Failed to load region.', "regionId" => $regionId];
        }
    }

    $regionPos      = getRegionPos($regionId);

    $chunk = loadChunk($chunkId);
    if (! $chunk) {
        $chunk = ["chunkId" => $chunkId, "blocks" => [], "entities" => []];
    }

    $localX = $x % 16;
    $localY = $y % 16;
    $localZ = $z % 16;
    if ($localX < 0) {
        $localX += 16;
    }

    if ($localY < 0) {
        $localY += 16;
    }

    if ($localZ < 0) {
        $localZ += 16;
    }

    $blockExists = false;
    foreach ($chunk['blocks'] as $block) {
        if ($block[0] === $localX && $block[1] === $localY && $block[2] === $localZ) {
            $blockExists = true;
            break;
        }
    }

    if ($blockExists) {
        error_log("Block already exists at position (" . $x . ", " . $y . ", " . $z . ") in chunk " . $chunkId);
        return ['error' => 'A block already exists at this position.'];
    }

    $chunk['blocks'][] = [$localX, $localY, $localZ, $blockId];
    saveChunk($chunkId, $chunk);
    error_log("Saved block to chunk " . $chunkId);

    $regionPos       = getRegionPos($regionId);
    $nearbyPlayerIds = [];

    for ($dx = -1; $dx <= 1; $dx++) {
        for ($dz = -1; $dz <= 1; $dz++) {
          error_log("Checking nearby region at offset (" . $dx . ", " . $dz . ") for place packet.");
            $currentRegionId     = getRegionId($regionPos[0] + $dx, $regionPos[1], $regionPos[2] + $dz);
            $currentRegionData   = loadRegion($currentRegionId);
            if  (!$currentRegionData) {
                continue;
            }
            foreach ($currentRegionData['entities'] as $entity) {
                if (isset($entity['playerId']) && ! in_array($entity['playerId'], $nearbyPlayerIds)) {
                    $nearbyPlayerIds[] = $entity['playerId'];
                }
            }
        }
    }
    $playerInRegion = false;
    foreach ($nearbyPlayerIds as $nearbyPlayerId) {
        if ($nearbyPlayerId == $playerId) {
            $playerInRegion = true;
            break;
        } else {
            error_log("Nearby player " . $nearbyPlayerId . " is not the placing player " . $playerId . " for place packet.");
        }
    }
    if (! $playerInRegion) {
        error_log("Player " . $playerId . " not found near region " . $regionId . " for place packet.");
        return ['error' => 'Player is not in the correct region.'];
    }

    error_log("Found " . count($nearbyPlayerIds) . " players to notify");

    $event = [
        'type'      => 'place',
        'x'         => $x,
        'y'         => $y,
        'z'         => $z,
        'blockId'   => $blockId,
        'playerId'  => $playerId,
        'regionId'  => $regionId,
        'timestamp' => time(),
        'pose'      => $targetPos,
    ];

    broadCastRegionEvents($event);

    return ['success' => true, 'message' => 'Block placed successfully.'];
}
