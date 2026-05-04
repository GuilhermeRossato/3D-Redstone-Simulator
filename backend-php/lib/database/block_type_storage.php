<?php

require_once __DIR__ . "/storage_object_store.php";

function getBlockDataId($blockData)
{
    if (is_array($blockData) && array_key_exists("blockId", $blockData)) {
        $blockData = $blockData["blockId"];
    }
    if (is_array($blockData) && array_key_exists("id", $blockData)) {
        $blockData = $blockData["id"];
    }
    if (is_string($blockData)) {
        $blockData = intval($blockData);
    }
    if (! is_integer($blockData)) {
        throw new InvalidArgumentException("Invalid block data format");
    }
    return $blockData;
}

function getBlockDataKey($blockData)
{
    if (is_array($blockData) && array_key_exists("key", $blockData) && is_string($blockData["key"])) {
        $blockData = $blockData["key"];
    }
    if (is_array($blockData) && array_key_exists("name", $blockData) && is_string($blockData["name"])) {
        $blockData = $blockData["name"];
    }
    if (is_string($blockData)) {
        $blockData = str_replace("-", "_", str_replace(".json", "", strtolower($blockData)));
    }
    if (! is_string($blockData)) {
        throw new InvalidArgumentException("Invalid block data format");
    }
    return $blockData;
}

function getBlockTextureList($blockData)
{
    $list = [];
    if (! isset($blockData["texture"]) && isset($blockData["textures"])) {
        $blockData["texture"] = $blockData["textures"];
        unset($blockData["textures"]);
    }
    if (! isset($blockData["texture"]) && isset($blockData["textureList"])) {
        $blockData["texture"] = $blockData["textureList"];
        unset($blockData["textureList"]);
    }
    if (! isset($blockData["texture"])) {
        error_log("No texture found in block" . $blockData["key"] . "data: " . json_encode($blockData));
    } else if (is_string($blockData["texture"])) {
        array_push($list, $blockData["texture"]);
    } else if (is_array($blockData["texture"])) {
        foreach ($blockData["texture"] as $key => $texture) {
            if ($key === "url") {
                array_push($list, $texture);
            } else if ($key === 'left') {
                $list[0] = $texture;
            } else if ($key === 'right') {
                $list[1] = $texture;
            } else if ($key === 'front') {
                $list[2] = $texture;
            } else if ($key === 'back') {
                $list[3] = $texture;
            } else if ($key === 'top') {
                $list[4] = $texture;
            } else if ($key === 'bottom') {
                $list[5] = $texture;
            } else if (is_string($texture)) {
                array_push($list, $texture);
            } else {
                error_log("Invalid texture entry in blockData: " . json_encode($texture));
            }
        }
    } else {
        error_log("Invalid texture format in blockData: " . json_encode($blockData["texture"]));
    }
    return array_unique($list);
}

$is_first_load = true;
function initBlockTypeStorage()
{
    global $is_first_load;
    if (! $is_first_load) {
        return;
    }
    $is_first_load = false;

    error_log("BlockTypeStorage initializing...");
    $filePath = dirname(getcwd() . "/frontend/assets/init-block-types.jsonl");
    if (! file_exists($filePath)) {
        error_log("BlockType IDs file not found: " . $filePath);
        return;
    }
    $text = file_get_contents($filePath);
    $list = json_decode("[" . rtrim($text, ",") . "]", true);
    foreach ($list as $blockType) {
        $id       = getBlockDataId($blockType);
        $key      = getBlockDataKey($blockType);
        $textures = getBlockTextureList($blockType);
        if (isset($blockType["texture"])) {
            unset($blockType["texture"]);
        }
        if (isset($blockType["textures"])) {
            unset($blockType["textures"]);
        }
        if (isset($blockType["textureList"])) {
            unset($blockType["textureList"]);
        }
        if (isset($blockType["id"])) {
            unset($blockType["id"]);
        }
        if (isset($blockType["uid"])) {
            unset($blockType["uid"]);
        }
        if (isset($blockType["key"])) {
            unset($blockType["key"]);
        }
        $blockType["id"]  = $id;
        $blockType["key"] = $key;
        if (count($textures) > 1) {
            $blockType["textures"] = $textures;
        } elseif (count($textures) === 1) {
            $blockType["texture"] = $textures[0];
        }
        if (existsBlockType($key)) {
            $blockData = loadBlockType($key);
            if ($blockData) {
                $changed = false;
                foreach ($blockType as $key => $value) {
                    if (! isset($blockData[$key]) || $blockData[$key] !== $value) {
                        $changed         = true;
                        $blockData[$key] = $value;
                    }
                }
                if ($changed) {
                    error_log("Updating blockType: " . $key);
                    saveBlockType($key, $blockData);
                }
            } else {
                error_log("Failed to load existing block type: " . $key . " (rewriting with init block type data)");
                saveBlockType($key, $blockType);
            }
        } else {
          error_log("Creating initial block type: " . $key);
          createBlockType($key, $blockType);
        }
    }
}

function getBlockFilePathParts($key)
{
    if (is_array($key) && array_key_exists("key", $key)) {
        $key = $key["key"];
    }
    return ["block-types", $key, null];
}

function getBlockTypeFilePath($key)
{
    $parts = getBlockFilePathParts($key);
    return getStorageObjectFilePath($parts[0], $parts[1], $parts[2], false);
}

function loadBlockType($key, $fallback = null)
{
    $parts     = getBlockFilePathParts($key);
    $blockType = loadStorageObject($parts[0], $parts[1], $parts[2], $fallback);
    if ($blockType) {
        error_log("Loaded blockType: " . $key);
    } else {
        error_log("Failed to load blockType: " . $key);
    }
    return $blockType;
}

function existsBlockType($key)
{
    $filePath = getBlockTypeFilePath($key);
    return file_exists($filePath);
}

function saveBlockType($key, $data)
{
    $parts = getBlockFilePathParts($key);
    $size  = writeStorageObject($parts[0], $parts[1], $parts[2], $data);
    error_log("Saved blockType: " . $key . " with data size: " . $size);
    return $size;
}

function deleteBlockType($key)
{
    if (! existsBlockType($key)) {
        error_log("BlockType does not exist: " . $key);
        return false;
    }
    $parts  = getBlockFilePathParts($key);
    $result = clearStorageObject($parts[0], $parts[1], $parts[2]);
    if ($result) {
        error_log("Deleted blockType: " . $key);
    } else {
        error_log("Failed to delete blockType: " . $key);
    }
    return $result;
}

function createBlockType($key, $data)
{
    $key = is_array($key) && array_key_exists("blockId", $key) ? $key["blockId"] : $key;
    if (existsBlockType($key)) {
        error_log("BlockType already exists: " . $key);
        return null;
    }

    $size = saveBlockType($key, $data);
    error_log("Created new blockType: " . $key . " with data size: " . $size);
    return $data;
}
