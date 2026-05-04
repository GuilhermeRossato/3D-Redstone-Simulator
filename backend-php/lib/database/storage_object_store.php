<?php

function getProjectFolderPath($parts)
{
    if (is_array($parts)) {
        $parts = array_filter($parts, function ($p) {
            return (is_string($p) && strlen($p)) || is_numeric($p);
        });
        $parts = implode(DIRECTORY_SEPARATOR, $parts);
    } else if (is_string($parts) && strlen($parts) && str_starts_with($parts, DIRECTORY_SEPARATOR)) {
        $parts = substr($parts, 1);
    }
    $prefix = "backend-data";
    $i      = strpos($parts, $prefix);
    if ($i !== false) {
        $parts = substr($parts, $i + strlen($prefix));
    }
    $parts = ltrim($parts, DIRECTORY_SEPARATOR);
    $parts = getcwd() . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . $prefix . $parts;
    return $parts;
}

function getStorageObjectFilePath($type, $name, $id, $isArray = false)
{
    $dataFolderPath = getProjectFolderPath("backend-data");
    $parts          = array_filter([$type, $name, $id], function ($p) {
        return (is_string($p) && strlen($p)) || is_numeric($p);
    });
    return $dataFolderPath . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $parts) . ".json" . ($isArray ? "l" : "");
}

function confirmPath($target)
{
    $target               = dirname($target);
    static $confirmRecord = [];
    if (! isset($confirmRecord[$target])) {
        $confirmRecord[$target] = time();
        if (! file_exists($target)) {
            mkdir($target, 0777, true);
        }
    }
}

function loadStorageObject($type, $name = null, $id = null, $fallback = null)
{
    try {
        $filePath = getStorageObjectFilePath($type, $name, $id, false);
        error_log("Loading storage object from: " . $filePath);
        if (! file_exists($filePath)) {
            return $fallback;
        }
        $text = file_get_contents($filePath);
        $obj  = json_decode($text, true) ?? [];
        if (is_array($fallback)) {
            foreach ($fallback as $key => $value) {
                if (! isset($obj[$key])) {
                    $obj[$key] = $value;
                }
            }
        }
        if (isset($fallback['fileSize']) && is_numeric($fallback['fileSize'])) {
            $obj['fileSize'] = strlen($text);
        }
        return $obj;
    } catch (Exception $e) {
        error_log("Error loading storage object: " . $e->getMessage());
        return $fallback;
    }
}

function loadStorageArray($type, $name = null, $id = null, $fallback = null)
{
    try {
        $filePath = getStorageObjectFilePath($type, $name, $id, true);
        if (! file_exists($filePath)) {
            return [];
        }
        $text = file_get_contents($filePath);
        $list = json_decode("[" . rtrim($text, ",") . "]", true);
        return $list ?: [];
    } catch (Exception $e) {
        error_log("Error loading storage array: " . $e->getMessage());
        return [];
    }
}

function writeStorageObject($type, $name = null, $id = null, $state = [])
{
    try {
        $text     = is_string($state) ? $state : json_encode($state, JSON_PRETTY_PRINT);
        $filePath = getStorageObjectFilePath($type, $name, $id, false);
        confirmPath($filePath);
        file_put_contents($filePath, $text);
        return strlen($text);
    } catch (Exception $e) {
        error_log("Error writing storage object: " . $e->getMessage());
        return 0;
    }
}

function appendStorageArray($type, $name = null, $id = null, $array = [])
{
    try {
        $list = is_array($array) ? $array : [$array];
        if (empty($list)) {
            return 0;
        }
        $text = implode("\n", array_map(function ($e) {
            return json_encode($e) . ",";
        }, $list)) . "\n";
        $filePath = getStorageObjectFilePath($type, $name, $id, true);
        confirmPath($filePath);
        error_log("Appending to storage array at: " . $filePath . " with count: " . count($list));
        file_put_contents($filePath, $text, FILE_APPEND);
        return count($list);
    } catch (Exception $e) {
        error_log("Error appending to storage array: " . $e->getMessage());
        return 0;
    }
}

function writeStorageArray($type, $name = null, $id = null, $list = [])
{
    try {
        if (! is_array($list)) {
            throw new InvalidArgumentException("Expected array");
        }
        $text = implode("\n", array_map(function ($e) {
            return json_encode($e) . ",";
        }, $list)) . "\n";
        $filePath = getStorageObjectFilePath($type, $name, $id, true);
        confirmPath($filePath);
        file_put_contents($filePath, $text);
        return count($list);
    } catch (Exception $e) {
        error_log("Error writing storage array: " . $e->getMessage());
        return 0;
    }
}

function clearStorageObject($type, $name = null, $id = null)
{
    try {
        $filePath = getStorageObjectFilePath($type, $name, $id, false);
        if (file_exists($filePath)) {
            unlink($filePath);
            return true;
        }
        return false;
    } catch (Exception $e) {
        error_log("Error clearing storage object: " . $e->getMessage());
        return false;
    }
}

function clearStorageArray($type, $name = null, $id = null)
{
    try {
        $filePath = getStorageObjectFilePath($type, $name, $id, true);
        if (file_exists($filePath)) {
            unlink($filePath);
            return true;
        }
        return false;
    } catch (Exception $e) {
        error_log("Error clearing storage array: " . $e->getMessage());
        return false;
    }
}
