<?php

require_once __DIR__ . "/storage_object_store.php";

function getActivePlayerFilePath($playerId) {
    return getStorageObjectFilePath("active-players", $playerId, null);
}

function setActivePlayer($playerId, $data) {
  if ($data === null || $data === false) {
    throw new Exception("Invalid player data for playerId: " . $playerId);
  }
  writeStorageObject("active-players", $playerId, null, $data);
}

function getActivePlayer($playerId) {
  return loadStorageObject("active-players", $playerId, null, null);
}

function getActivePlayersDir() {
  return dirname(getActivePlayerFilePath("p"));
}

function loadPlayer($playerId, $fallback = null) {
    $player = loadStorageObject("players", substr($playerId, 1, 2), $playerId, $fallback);
    if ($player) {
        error_log("Loaded player: " . $playerId);
    } else {
        error_log("Failed to load player: " . $playerId);
    }
    return $player;
}

function savePlayer($playerId, $data) {
    $result = writeStorageObject("players", substr($playerId, 1, 2), $playerId, $data);
    error_log("Saved player: " . $playerId . " with data size: " . $result);
    return $result;
}

function deletePlayer($playerId) {
    $result = clearStorageObject("players", substr($playerId, 1, 2), $playerId);
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
    $playerIdList = array_map(function($p) { return $p["playerId"]; }, $players);
    if (in_array($playerId, $playerIdList)) {
        error_log("Player already exists: " . $playerId);
        return null;
    }
    appendStorageArray("players", "created", null, [$playerId]);
    savePlayer($playerId, $data);
    error_log("Created new player: " . $playerId);
}

