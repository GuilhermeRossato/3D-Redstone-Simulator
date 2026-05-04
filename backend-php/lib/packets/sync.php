<?php

require_once __DIR__ . "/../database/player_storage.php";
require_once __DIR__ . "/../database/chunk_storage.php";
require_once __DIR__ . "/../database/region_storage.php";
require_once __DIR__ . "/../database/block_type_storage.php";

function handleSyncPacket($data)
{
    if (! isset($data["playerId"]) || empty($data["playerId"])) {
        return ["error" => "Missing playerId in data."];
    }
    if (! isset($data["index"]) || !is_integer($data["index"])) {
        return ["error" => "Missing index in data."];
    }
    if (! isset($data["client"]) || !is_integer($data["client"])) {
        return ["error" => "Missing client in data."];
    }
    $subjects = isset($data["subjects"]) && is_array($data["subjects"]) ? $data["subjects"] : [];
    $responses = [];
    foreach ($subjects as $subject) {
      if (str_starts_with($subject, "c")) {
        // Chunk load
        $responses[$subject] = loadChunk($subject);
      } elseif (str_starts_with($subject, "r")) {
        // Region load
        $responses[$subject] = loadRegion($subject);
      } elseif (!str_contains($subject, ",") && !str_contains($subject, "/") && !str_contains($subject, "\\") && !str_contains($subject, " ")) {
        // Block type load
        $responses[$subject] = loadBlockType($subject);
      } else {
        error_log("Unknown sync subject: " . $subject);
        $responses[$subject] = ["error" => "Unknown sync subject: " . $subject];
      }
    }
    $timeMs = round(microtime(true) * 1000);
    return ["status" => "success", "playerId" => $data["playerId"], "index" => $data["index"], "client" => $data["client"], "server" => $timeMs, "responses" => $responses];
}