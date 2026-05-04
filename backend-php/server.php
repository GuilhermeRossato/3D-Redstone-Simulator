<?php

$requestUri = $_SERVER["REQUEST_URI"];
$i = strpos($requestUri, "?");
if ($i !== false) {
    $requestUri = substr($requestUri, 0, $i);
}
$method     = $_SERVER["REQUEST_METHOD"];
error_log("Received " . $method . " " . $requestUri);

if ($requestUri === "/") {
    http_response_code(301);
    header("Location: /3D-Redstone-Simulator/frontend/index.html");
    exit;
} elseif ($requestUri === "/3D-Redstone-Simulator/index.html" || $requestUri === "/3D-Redstone-Simulator/" || $requestUri === "/3D-Redstone-Simulator/index.php") {
  http_response_code(301);
    header("Location: /3D-Redstone-Simulator/frontend/index.html");
    exit;
} elseif ($requestUri === "/3D-Redstone-Simulator/frontend/index.html") {
    $filePath = __DIR__ . "/../frontend/index.html";
    $content  = file_get_contents($filePath);
    if ($content === false) {
        error_log("Failed to read index.html");
        http_response_code(500);
        echo "Internal Server Error";
        exit;
    }
    echo $content;
    exit;
} elseif (str_starts_with($requestUri, "/3D-Redstone-Simulator/api/")) {
    $apiPath = substr($requestUri, strlen("/3D-Redstone-Simulator/api/"));
    $apiFile = __DIR__ . "/api/" . $apiPath;
    if (file_exists($apiFile) && is_file($apiFile)) {
        include $apiFile;
        exit;
    } else {
        error_log("API file not found: " . $apiFile);
        http_response_code(404);
        echo "API Not Found: " . htmlspecialchars($requestUri);
        exit;
    }
} else if (str_starts_with($requestUri, "/3D-Redstone-Simulator/backend-php/")) {
    $targetPath = __DIR__ . "/" . substr($requestUri, strlen("/3D-Redstone-Simulator/backend-php/"));
    if (file_exists($targetPath) && is_file($targetPath)) {
        include $targetPath;
        exit;
    } else {
        error_log("Backend PHP file not found: " . $targetPath);
        http_response_code(404);
        echo "File Not Found: " . htmlspecialchars($requestUri);
        exit;
    }
} else if (str_starts_with($requestUri, "/3D-Redstone-Simulator/frontend/")) {
    $targetPath = __DIR__ . "/../.." . $requestUri;
    if (file_exists($targetPath) && is_file($targetPath)) {
        $content = file_get_contents($targetPath);
        if ($content === false) {
            error_log("Failed to read file: " . $targetPath);
            http_response_code(500);
            echo "Internal Server Error";
            exit;
        }
        $extension   = pathinfo($targetPath, PATHINFO_EXTENSION);
        $contentType = match (strtolower($extension)) {
            "html"  => "text/html",
            "htm"   => "text/html",
            "css"   => "text/css",
            "js"    => "application/javascript",
            "txt"   => "text/plain",
            "text"  => "text/plain",
            "json"  => "application/json",
            "jsonl" => "text/plain",
            "png"   => "image/png",
            "jpg", "jpeg" => "image/jpeg",
            "bmp"   => "image/bmp",
            "gif"   => "image/gif",
            "gz"    => "application/octet-stream",
            "rar"   => "application/octet-stream",
            "zip"   => "application/octet-stream",
            default => "text/plain",
        };
        header("Content-Type: " . $contentType);
        echo $content;
        exit;
    } else {
        error_log("Static file not found: " . $targetPath);
        http_response_code(404);
        echo "File Not Found: " . htmlspecialchars($requestUri);
        exit;
    }
} else {
    echo "Received request for URI: " . $requestUri;
    http_response_code(404);
    echo "Not Found: " . htmlspecialchars($requestUri);
    error_log("No matching route found for URI: " . $requestUri);
    exit;
}
