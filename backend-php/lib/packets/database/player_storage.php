<?php

require_once __DIR__ . "/storage_object_store.php";

$playerCache = [];

function setPlayerCache($playerId, $data) {
    global $playerCache;
    $playerCache[$playerId] = $data;
}

function getPlayerCache($playerId) {
    global $playerCache;
    return $playerCache[$playerId] ?? null;
}

function getPlayerFilePath($playerId) {
    return getStorageObjectFilePath("players", substr($playerId, 0, 1), $playerId, false);
}

function loadPlayer($playerId, $fallback = null) {
    $player = loadStorageObject("players", substr($playerId, 0, 1), $playerId, $fallback);
    if ($player) {
        error_log("Loaded player: " . $playerId);
    } else {
        error_log("Failed to load player: " . $playerId);
    }
    return $player;
}

function savePlayer($playerId, $data) {
    $result = writeStorageObject("players", substr($playerId, 0, 1), $playerId, $data);
    error_log("Saved player: " . $playerId . " with data size: " . $result);
    return $result;
}

function deletePlayer($playerId) {
    $result = clearStorageObject("players", substr($playerId, 0, 1), $playerId);
    if ($result) {
        error_log("Deleted player: " . $playerId);
    } else {
        error_log("Failed to delete player: " . $playerId);
    }
    return $result;
}

function listPlayers() {
    $players = loadStorageArray("players", "created", null);
    error_log("Loaded player list with count: " . count($players));
    return $players;
}

function createPlayer($playerId, $data) {
    $players = listPlayers();
    if (in_array($playerId, $players)) {
        error_log("Player already exists: " . $playerId);
        return null;
    }
    appendStorageArray("players", "created", null, [$playerId]);
    $player = savePlayer($playerId, $data);
    error_log("Created new player: " . $playerId);
    return $player;
}

