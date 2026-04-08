<?php

$memcache = new Google\AppEngine\Api\Memcache\Memcache();

# reset all
$memcache->flush();

echo "Flushed all memcache entries.";

# list all memcache methods
$methods = get_class_methods($memcache);

echo "Available Memcache methods: " . implode(", ", $methods);

if (isset($_GET['ret'])&&!empty($_GET['ret'])) {
    $ret = $_GET['ret'];
    echo "<script>" . PHP_EOL;
    echo "window.location.href = " . json_encode($ret) . ";" . PHP_EOL;
    echo "</script>" . PHP_EOL;

    echo "<script>" . PHP_EOL;
    echo "setTimeout(function() {" . PHP_EOL;
    echo "  window.location.href = " . json_encode($ret) . ";" . PHP_EOL;
    echo "}, 1000);" . PHP_EOL;
    echo "</script>" . PHP_EOL;
}
