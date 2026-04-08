<?php
// a php file that starts a http file serving php files or static assets
$host = "localhost";
$port = 3000;
$rootIndex = "./server.php";

// Start the PHP built-in server
echo "Starting server at http://$host:$port\n";
echo "Press Ctrl+C to stop the server.\n";
exec("php -S $host:$port $rootIndex");