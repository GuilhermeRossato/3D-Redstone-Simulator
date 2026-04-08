<?php

require_once __DIR__ . "/database/player_storage.php";

function handleContextPacket($data)
{
    if (! isset($data["playerId"]) || empty($data["playerId"])) {
        return ["error" => "Missing playerId in data."];
    }
    $player = getPlayerCache($data["playerId"]);
    if (! $player) {
        error_log("Player not found");
        return ["error" => "Player not found.", "playerId" => $data["playerId"]];
    }
    header('Content-Type: application/json');
    return (["status" => "success", "playerId" => $data["playerId"], "cookieId" => $data["cookieId"], "player" => $player]);
}
