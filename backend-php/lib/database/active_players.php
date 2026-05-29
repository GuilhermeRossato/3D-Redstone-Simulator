<?php

require_once __DIR__ . "/storage_object_store.php";

function getFastActivePlayerFilePath($cold = false)
{
    return getStorageObjectFilePath("active-players", $cold ? "cold" : "hot", null);
}

function setFastActivePlayer($data, $cold = false)
{
    if ($data === null || $data === false) {
        throw new Exception("Invalid player data for fast active player");
    }
    validateFastActivePlayerData($data);
    writeStorageObject("active-players", $cold ? "cold" : "hot", null, $data);
}

function validateFastActivePlayerData($data)
{
    if (! is_array($data)) {
        throw new Exception("Fast active player data must be an array");
    }

    foreach ($data as $player) {
        if (! is_array($player)) {
            throw new Exception("Fast active player entry must be an array");
        }
        if (! isset($player['playerId'])) {
            throw new Exception("Fast active player entry must have a playerId");
        }
        if (! isset($player['pose']) || ! is_array($player['pose'])) {
            throw new Exception("Fast active player entry must have a pose array");
        }
        if (! isset($player['queue']) || ! is_array($player['queue'])) {
          $player['queue'] = [];
            // throw new Exception("Fast active player entry must have a queue array");
        }
    }
}

function getFastActivePlayer($cold = false)
{
    $list = loadStorageObject("active-players", $cold ? "cold" : "hot", null, null);
    if ($list === null) {
        return [];
    }
    return $list;
}
