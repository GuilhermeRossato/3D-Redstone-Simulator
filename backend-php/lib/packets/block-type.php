<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/chunk_storage.php";
require_once __DIR__ . "/../database/region_storage.php";
require_once __DIR__ . "/../database/block_type_storage.php";

function handleBlockTypePacket($data)
{
    if (! isset($data["playerId"]) || empty($data["playerId"])) {
        return ["error" => "Missing playerId in data."];
    }
    if ($data["playerId"][0] !== "p") {
        return ["error" => "Invalid playerId format. Expected to start with 'p'."];
    }
    $player = getActivePlayer($data["playerId"]);
    if (! $player) {
        error_log("Player not found: " . $data["playerId"]);
        return ["error" => "Player not found", "playerId" => $data["playerId"]];
    }
    if (! isset($data["list"]) || ! is_array($data["list"]) || count($data["list"]) === 0) {
        error_log("Invalid list data for player: " . $data["playerId"]);
        return ["error" => "Invalid list data. Expected non-empty array."];
    }
    
}
