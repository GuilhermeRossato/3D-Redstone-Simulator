<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/chunk_storage.php";
require_once __DIR__ . "/../database/region_storage.php";

function handleContextPacket($data)
{
    if (! isset($data["playerId"]) || empty($data["playerId"])) {
        return ["error" => "Missing playerId in data."];
    }
    if (! isset($data["cookieId"]) || empty($data["cookieId"])) {
        return ["error" => "Missing cookieId in data."];
    }
    if ($data["playerId"][0] !== "p") {
        return ["error" => "Invalid playerId format. Expected to start with 'p'."];
    }
    $player = getActivePlayer($data["playerId"]);
    if (! $player) {
        error_log("Player not found: " . $data["playerId"]);
        return ["error" => "Player not found", "playerId" => $data["playerId"]];
    }
    if (! isset($player["pose"]) || ! is_array($player["pose"]) || count($player["pose"]) !== 6) {
        error_log("Invalid pose data for player: " . $data["playerId"]);
        $player["pose"] = [0, 0, 0, 0, 0, 0];
        setActivePlayer($data["playerId"], $player);
        savePlayer($data["playerId"], $player);
    }
    if (abs($player["pose"][0]) < 0.5 && abs($player["pose"][1]) < 0.5 && abs($player["pose"][2]) < 0.5) {
        error_log("Player pose is at origin, moving to spawn point.");
        $player["pose"][0] = 8;
        $player["pose"][1] = 8;
        $player["pose"][2] = 8;
        $player["pose"][3] = 0;
        $player["pose"][4] = -1;
        $player["pose"][5] = 0;
        savePlayer($data["playerId"], $player);
    }
    // Surrounding block offsets for context awareness
    $chunks       = [];
    $regions      = [];
    $offsets      = getSurroundingOffsets();
    $offset_count = count($offsets);
    error_log("Calculating context for player " . $data["playerId"] . " at pose: " . implode(", ", array_slice($player["pose"], 0, 3)) . " with " . $offset_count . " surrounding offsets.");
    for ($i = 0; $i < $offset_count; $i++) {
        $offset = $offsets[$i];
        error_log("Checking offset " . ($i + 1) . "/" . $offset_count . ": " . implode(", ", $offset));
        $pos = [
            $player["pose"][0] + ($offset[0] * 16),
            $player["pose"][1] + ($offset[1] * 16),
            $player["pose"][2] + ($offset[2] * 16),
        ];
        $chunk = getChunkIdFromPos($pos);
        if ($i === 0 || existsChunk($chunk)) {
            array_push($chunks, $chunk);
        }
        $pos = [
            $player["pose"][0] + ($offset[0] * 64),
            $player["pose"][1] + ($offset[1] * 64),
            $player["pose"][2] + ($offset[2] * 64),
        ];
        $region = getRegionIdFromPos($pos);
        if ($i === 0 || existsRegion($region)) {
            array_push($regions, $region);
        }
    }
    error_log("Context for player " . $data["playerId"] . ": " . count($chunks) . " chunks, " . count($regions) . " regions.");
    return (["status" => "success", "playerId" => $data["playerId"], "player" => $player, "chunks" => $chunks, "regions" => $regions]);
}
