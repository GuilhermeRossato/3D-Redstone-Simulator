<?php

$memcache = new Google\AppEngine\Api\Memcache\Memcache();

# reset all
$memcache->flush();

echo "Flushed all memcache entries.";
# list all memcache methods
$methods = get_class_methods($memcache);
echo "Available Memcache methods: " . implode(", ", $methods);