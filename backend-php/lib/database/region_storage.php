<?php

require_once __DIR__ . "/storage_object_store.php";

function getRegionIdFromPos($pose)
{
    $rx = floor($pose[0] / 64);
    $ry = floor($pose[1] / 64);
    $rz = floor($pose[2] / 64);
    return getRegionId($rx, $ry, $rz);
}

function getRegionIdFromPosOffset($pose, $offset = [0, 0, 0])
{
    $rx = floor($pose[0] / 64) + $offset[0];
    $ry = floor($pose[1] / 64) + $offset[1];
    $rz = floor($pose[2] / 64) + $offset[2];
    return "r" . floor($ry) . "/" . floor($rx) . "x" . floor($rz);
}

function getRegionId($rx, $ry, $rz)
{
    if (is_array($rx) && count($rx) === 3) {
        $ry = $rx[1];
        $rz = $rx[2];
        $rx = $rx[0];
    }
    return "r" . floor($ry) . "/" . floor($rx) . "x" . floor($rz);
}

function getRegionPos($regionId)
{
    if (is_array($regionId) && isset($regionId['regionId']) && is_string($regionId['regionId'])) {
        $regionId = $regionId['regionId'];
    }
    if (is_array($regionId) && count($regionId) === 3 && isset($regionId[0]) && is_numeric($regionId[0]) && is_numeric($regionId[1]) && is_numeric($regionId[2])) {
        $regionId = getRegionId($regionId[0], $regionId[1], $regionId[2]);
    }
    if (is_object($regionId) && isset($regionId->regionId) && is_string($regionId->regionId)) {
        $regionId = $regionId->regionId;
    }
    if (is_string($regionId) && str_starts_with($regionId, "r")) {
        $regionId = substr($regionId, 1);
    }
    $i = strpos($regionId, "/");
    if ($i === false) {
        return null;
    }
    $j = strpos($regionId, "x", $i);
    if ($j === false) {
        return null;
    }
    $ry = intval(substr($regionId, 1, $i - 1));
    $rx = intval(substr($regionId, $i + 1, $j - $i - 1));
    $rz = intval(substr($regionId, $j + 1));
    return [$rx, $ry, $rz];
}

function getRegionFilePathParts($regionId)
{
    $offset = str_starts_with($regionId, "r") ? 1 : 0;
    $i      = strpos($regionId, "/");
    return ["regions", substr($regionId, $offset, $i - $offset), substr($regionId, $i + 1)];
}

function getRegionFilePath($regionId)
{
    $parts = getRegionFilePathParts($regionId);
    return getStorageObjectFilePath($parts[0], $parts[1], $parts[2], false);
}

function isPosInsideRegion($regionId, $pose)
{
    $dist = getRegionDistanceFromPos($regionId, $pose);
    if ($dist === false) {
        return false;
    }
    $dx = abs($dist[0]);
    $dy = abs($dist[1]);
    $dz = abs($dist[2]);
    // error_log("Distance from region " . $regionId . " to pose: " . implode(", ", $dist) . " is " . $dx . ", " . $dy . ", " . $dz);
    return ($dx < 1 && $dy < 1 && $dz < 1);
}

function getRegionDistanceFromPos($regionId, $pose)
{
    $regionPos = getRegionPos($regionId);
    if (! $regionPos) {
        return false;
    }
    $rx = $regionPos[0];
    $ry = $regionPos[1];
    $rz = $regionPos[2];
    return [
        $rx - floor($pose[0] / 64),
        $ry - floor($pose[1] / 64),
        $rz - floor($pose[2] / 64),
    ];
}

function existsRegion($regionId)
{
    $filePath = getRegionFilePath($regionId);
    return file_exists($filePath);
}

function loadRegion($regionId, $fallback = null)
{
    $parts  = getRegionFilePathParts($regionId);
    $region = loadStorageObject($parts[0], $parts[1], $parts[2], $fallback);
    if ($region) {
        error_log("Loaded region: " . $regionId);
    } else {
        error_log("Failed to load region: " . $regionId);
    }
    return $region;
}

function saveRegion($regionId, $data)
{
    $parts  = getRegionFilePathParts($regionId);
    $result = writeStorageObject($parts[0], $parts[1], $parts[2], $data);
    error_log("Saved region: " . $regionId . " with data size: " . $result);
    return $result;
}

function getSurroundingOffsets()
{
    return [
        [0, 0, 0], [-1, 0, 0],
        [0, -1, 0], [0, 0, -1],
        [0, 0, 1], [0, 1, 0],
        [1, 0, 0], [-1, -1, 0],
        [-1, 0, -1], [-1, 0, 1],
        [-1, 1, 0], [0, -1, -1],
        [0, -1, 1], [0, 1, -1],
        [0, 1, 1], [1, -1, 0],
        [1, 0, -1], [1, 0, 1],
        [1, 1, 0], [-1, -1, -1],
        [-1, -1, 1], [-1, 1, -1],
        [-1, 1, 1], [1, -1, -1],
        [1, -1, 1], [1, 1, -1],
        [1, 1, 1],
    ];
}

function getSurroundingRegionIds($regionId, $includeSelf = false)
{
    $pos     = getRegionPos($regionId);
    if (!$pos) {
      throw new Exception("Invalid regionId: " . $regionId);
    }
    $offsets = getSurroundingOffsets();
    $regions = [];
    foreach ($offsets as $offset) {
        if (! $includeSelf && $offset[0] === 0 && $offset[1] === 0 && $offset[2] === 0) {
            continue;
        }
        $neighbor = getRegionId($pos[0] + $offset[0], $pos[1] + $offset[1], $pos[2] + $offset[2]);
        if (existsRegion($neighbor)) {
            array_push($regions, $neighbor);
        }
    }
    return $regions;
}

function deleteRegion($regionId)
{
    $parts  = getRegionFilePathParts($regionId);
    $result = clearStorageObject($parts[0], $parts[1], $parts[2]);
    if ($result) {
        error_log("Deleted region: " . $regionId);
    } else {
        error_log("Failed to delete region: " . $regionId);
    }
    return $result;
}

function createRegion($regionId, $data)
{
    if (existsRegion($regionId)) {
        error_log("Region already exists: " . $regionId);
        return null;
    }
    $size = saveRegion($regionId, $data);
    error_log("Created new region: " . $regionId);
    return $size;
}

function appendRegionEvent($event)
{
    $regionId = $event["regionId"];
    $parts = getRegionFilePathParts($regionId);
    error_log("Appending event to region " . $regionId . ": " . json_encode($event));
    appendStorageArray($parts[0], $parts[1], $parts[2], [$event]);
    
    if (isset($event["nextRegion"])) {
        $nextRegionId = $event["nextRegion"];
        $parts        = getRegionFilePathParts($nextRegionId);
        appendStorageArray($parts[0], $parts[1], $parts[2], [$event]);
    }
}

function loadRegionEvents($regionId)
{
    $parts  = getRegionFilePathParts($regionId);
    $events = loadStorageArray($parts[0], $parts[1], $parts[2]);
    return $events;
}

function getRegionEntityById($region, $entityIdOrPlayerId)
{
    if (! isset($region) || ! isset($region["entities"]) || ! is_array($region["entities"])) {
        return null;
    }
    foreach ($region["entities"] as $entity) {
        if (isset($entity["entityId"]) && $entity["entityId"] === $entityIdOrPlayerId) {
            return $entity;
        }
        if (isset($entity["playerId"]) && $entity["playerId"] === $entityIdOrPlayerId) {
            return $entity;
        }
    }
    return null;
}

function applyRegionEntityPoseUpdate($region, $entityIdOrPlayerId, $pose, $save = false)
{
    if (! isset($region) || ! $entityIdOrPlayerId || ! is_array($pose)) {
        return false;
    }
    if (is_string($region)) {
        $region = loadRegion($region);
    }
    $nextRegion = getRegionIdFromPos($pose);
    // remove from old region
    if ($nextRegion && $nextRegion !== $region["regionId"]) {
        error_log("Entity " . $entityIdOrPlayerId . " is moving from region " . $region["regionId"] . " to region " . $nextRegion);
        $list = [];
        $elem = null;
        foreach ($region["entities"] as $entity) {
            if (isset($entity["entityId"]) && $entity["entityId"] === $entityIdOrPlayerId) {
                $elem = $entity;
                continue;
            }
            if (isset($entity["playerId"]) && $entity["playerId"] === $entityIdOrPlayerId) {
                $elem = $entity;
                continue;
            }
            array_push($list, $entity);
        }
        // save old and add to new region
        if ($elem) {
            $region["entities"] = $list;
            if ($save) {
                saveRegion($region["regionId"], $region);
            }
            $elem["pose"]   = $pose;
            $nextRegionData = loadRegion($nextRegion);
            if (! $nextRegionData) {
                if ($save) {
                    createRegion($nextRegion, ["regionId" => $nextRegion, "createdAt" => time(), "entities" => []]);
                    $nextRegionData = loadRegion($nextRegion);
                } else {
                    $nextRegionData = ["regionId" => $nextRegion, "createdAt" => time(), "entities" => []];
                }
                $nextRegionData["entities"] = [];
            }
            array_push($nextRegionData["entities"], $elem);
            if ($save) {
                saveRegion($nextRegionData["regionId"], $nextRegionData);
            }
        } else {
            error_log("Failed to find entity " . $entityIdOrPlayerId . " in region " . $region["regionId"] . " for moving to region " . $nextRegion);
            return false;
        }
    }
    if ($save) {
        // Update pose in the same region
        $updated = false;
        foreach ($region["entities"] as &$entity) {
            if (isset($entity["entityId"]) && $entity["entityId"] === $entityIdOrPlayerId) {
                $entity["pose"] = $pose;
                $updated        = true;
            }
            if (isset($entity["playerId"]) && $entity["playerId"] === $entityIdOrPlayerId) {
                $entity["pose"] = $pose;
                $updated        = true;
            }
        }
        if ($updated) {
            saveRegion($region["regionId"], $region);
            return true;
        }
    }
    return false;
}

function applyChunkBlockUpdate($region, $event)
{
    $cid = getChunkIdFromPos([$event["x"] ?? null, $event["y"] ?? null, $event["z"] ?? null]);
    if (! $cid) {
        return;
    }
    $c = loadChunk($cid);
    if (! $c) {
        if ($event["id"] != 0) {
            $pos = getChunkPos($cid);
            createChunk($cid, [
                "chunkId" => $cid,
                "cx"      => $pos[0],
                "cy"      => $pos[1],
                "cz"      => $pos[2],
                "blocks"  => [],
            ]);
        }
        return;
    }
    $k      = implode(",", [$event["x"], $event["y"], $event["z"]]);
    $blocks = $c["blocks"] ?? [];
    if ((! isset($event["id"]) || $event["id"] === 0)) {
        if (! array_key_exists($k, $blocks)) {
            return false;
        }
        unset($blocks[$k]);
        return true;
    }
    if (array_key_exists($k, $blocks) && $blocks[$k]["id"] === $event["id"]) {
        return;
    }
    $blocks[$k] = [
        "x"         => $event["x"] ?? null,
        "y"         => $event["y"] ?? null,
        "z"         => $event["z"] ?? null,
        "id"        => $event["id"] ?? 0,
        "owner"     => $event["playerId"] ?? null,
        "timestamp" => $event["timestamp"] ?? null,
    ];
    $c["blocks"] = $blocks;
    saveChunk($c["chunkId"], $c);
}

function applyRegionEvents($region, $events, $save = true)
{
    foreach ($events as $event) {
        if (! isset($event["type"])) {
            continue;
        }
        if ($event["type"] === "move") {
            applyRegionEntityPoseUpdate($region, $event["entityId"] ?? null, $event["pose"] ?? null);
            continue;
        }
        if ($event["type"] === "place" || $event["type"] === "break") {
            applyChunkBlockUpdate($region, $event);
            continue;
        }
        if ($event["type"] === "interact") {
        }
        if ($event["type"] === "update") {
        }
        if ($event["type"] === "spawn") {
        }
        if ($event["type"] === "despawn") {
        }
        error_log("Unhandled event: " . json_encode($event));
        continue;
    }
}
function broadCastRegionEvents($events)
{
  if (is_array($events) && array_key_exists("type", $events)) {
    $events = [$events];
  }
  $playerEventMap = [];
  foreach ($events as $event) {
    $regionId     = $event["regionId"];
    $regionIdList = getSurroundingRegionIds($regionId);
    if (isset($event["nextRegion"])) {
      $nextRegionId = $event["nextRegion"];
      $extras       = getSurroundingRegionIds($nextRegionId);
      foreach ($extras as $id) {
        if (! in_array($id, $regionIdList)) {
          array_push($regionIdList, $id);
        }
      }
    }
    foreach ($regionIdList as $id) {
      $regionData = loadRegion($id);
      if (! $regionData) {
        error_log("Failed to load region data for region: " . $id);
        continue;
      }
      if (! is_array($regionData["entities"])) {
        $regionData["entities"] = [];
      }
      foreach ($regionData["entities"] as &$entity) {
        if (! isset($entity["type"]) || $entity["type"] !== "player") {
          continue;
        }
        if (! isset($entity["playerId"]) || empty($entity["playerId"])) {
          continue;
        }
        if (array_key_exists($entity["playerId"], $playerEventMap)) {
          continue;
        }
        if (! isset($entity["pose"]) || $entity["playerId"] === $event["playerId"]) {
          continue;
        }
        $dx    = abs($entity["pose"][0] - $event["pose"][0]);
        $dy    = abs($entity["pose"][1] - $event["pose"][1]);
        $dz    = abs($entity["pose"][2] - $event["pose"][2]);
        $delta = sqrt($dx * $dx + $dy * $dy + $dz * $dz);
        if ($delta > 64 + 8) {
          continue;
        }
        $playerEventMap[$entity["playerId"]] = $delta;
      }
    }
  }

  foreach ($playerEventMap as $playerId => $delta) {
    $p = getActivePlayer($playerId);
    if (! $p) {
      error_log("Failed to retrieve player from cache for playerId: " . $playerId);
      continue;
    }
    $regionId = getRegionIdFromPos($p["pose"]);
    $list     = $p["events"] ?? [];
    foreach ($events as $event) {
      array_push($list, $event);
    }
    $p["events"] = $list;
    setActivePlayer($playerId, $p);
  }
  return count($playerEventMap);
}
