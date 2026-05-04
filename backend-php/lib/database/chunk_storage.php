<?php

require_once __DIR__ . "/storage_object_store.php";

function getChunkIdFromPos($pose)
{
    $cx = floor($pose[0] / 16);
    $cy = floor($pose[1] / 16);
    $cz = floor($pose[2] / 16);
    return getChunkId($cx, $cy, $cz);
}

function getChunkIdFromPosOffset($pose, $offset = [0, 0, 0])
{
    $cx = floor($pose[0] / 16) + $offset[0];
    $cy = floor($pose[1] / 16) + $offset[1];
    $cz = floor($pose[2] / 16) + $offset[2];
    return getChunkId($cx, $cy, $cz);
}

function getChunkId($cx, $cy, $cz)
{
    if (is_array($cx) && count($cx) === 3) {
        $cy = $cx[1];
        $cz = $cx[2];
        $cx = $cx[0];
    }
    return "c" . floor($cy) . "/" . floor($cx) . "x" . floor($cz);
}

function getChunkPos($chunkId)
{
    if (is_array($chunkId) && isset($chunkId['chunkId']) && is_string($chunkId['chunkId'])) {
        $chunkId = $chunkId['chunkId'];
    }
    if (is_array($chunkId) && count($chunkId) === 3 && isset($chunkId[0]) && is_numeric($chunkId[0]) && is_numeric($chunkId[1]) && is_numeric($chunkId[2])) {
        $chunkId = getChunkId($chunkId[0], $chunkId[1], $chunkId[2]);
    }
    if (is_object($chunkId) && isset($chunkId->chunkId) && is_string($chunkId->chunkId)) {
        $chunkId = $chunkId->chunkId;
    }
    if (is_string($chunkId) && str_starts_with($chunkId, "c")) {
        $chunkId = substr($chunkId, 1);
    }
    $i = strpos($chunkId, "/");
    if ($i === false) {
        return null;
    }
    $j = strpos($chunkId, "x", $i);
    if ($j === false) {
        return null;
    }
    $cy = intval(substr($chunkId, 1, $i - 1));
    $cx = intval(substr($chunkId, $i + 1, $j - $i - 1));
    $cz = intval(substr($chunkId, $j + 1));
    return [$cx, $cy, $cz];
}

function getChunkFilePathParts($chunkId)
{
    $offset = str_starts_with($chunkId, "c") ? 1 : 0;
    $i      = strpos($chunkId, "/");
    return ["chunks", substr($chunkId, $offset, $i - $offset), substr($chunkId, $i + 1)];
}

function getChunkFilePath($chunkId)
{
    $parts = getChunkFilePathParts($chunkId);
    return getStorageObjectFilePath($parts[0], $parts[1], $parts[2], false);
}

function isPosInsideChunk($chunkId, $pose)
{
    $dist = getChunkDistanceFromPos($chunkId, $pose);
    error_log("Distance from chunk " . $chunkId . " to pose: " . implode(", ", $dist) . "for" . implode(", ", array_slice($pose, 0, 3)));
    if ($dist === false) {
        return false;
    }
    $dx = abs($dist[0]);
    $dy = abs($dist[1]);
    $dz = abs($dist[2]);
    return ($dx < 1 && $dy < 1 && $dz < 1);
}

function getChunkDistanceFromPos($chunkId, $pose)
{
    $chunkPos = getChunkPos($chunkId);
    if (! $chunkPos) {
        return false;
    }
    $cx = $chunkPos[0];
    $cy = $chunkPos[1];
    $cz = $chunkPos[2];
    return [
        $cx - floor($pose[0] / 16),
        $cy - floor($pose[1] / 16),
        $cz - floor($pose[2] / 16),
    ];
}

function existsChunk($chunkId)
{
  if ($chunkId === getChunkId(0, 0, 0)) {
      return true;
  }
    $filePath = getChunkFilePath($chunkId);
    return file_exists($filePath);
}



function loadChunk($chunkId, $fallback = null)
{
    if ($chunkId === getChunkId(0, 0, 0)) {
      $chunk = [
          "chunkId" => $chunkId,
          "blocks"  => [],
          "entities" => [],
      ];
      for ($x = 0; $x < 16; $x++) {
          for ($y = 0; $y < 1; $y++) {
              for ($z = 0; $z < 16; $z++) {
                  $chunk["blocks"][] = [$x, $y, $z, 1];
              }
          }
      }
      return $chunk;
    }
    $parts = getChunkFilePathParts($chunkId);
    $chunk = loadStorageObject($parts[0], $parts[1], $parts[2], $fallback);
    if ($chunk) {
        error_log("Loaded chunk: " . $chunkId);
    } else {
        error_log("Failed to load chunk: " . $chunkId);
    }
    $chunkEvents = loadStorageArray($parts[0], $parts[1], $parts[2], []);
    $chunk["events"] = is_array($chunkEvents) ? $chunkEvents : [];
    return $chunk;
}

function saveChunk($chunkId, $data)
{
    $parts  = getChunkFilePathParts($chunkId);
    $result = writeStorageObject($parts[0], $parts[1], $parts[2], $data);
    error_log("Saved chunk: " . $chunkId . " with data size: " . $result);
    return $result;
}

function deleteChunk($chunkId)
{
    $parts  = getChunkFilePathParts($chunkId);
    $result = clearStorageObject($parts[0], $parts[1], $parts[2]);
    if ($result) {
        error_log("Deleted chunk: " . $chunkId);
    } else {
        error_log("Failed to delete chunk: " . $chunkId);
    }
    return $result;
}

function createChunk($chunkId, $data)
{
    if (existsChunk($chunkId)) {
        error_log("Chunk already exists: " . $chunkId);
        return null;
    }
    $size = saveChunk($chunkId, $data);
    error_log("Created new chunk: " . $chunkId);
    return $size;
}
