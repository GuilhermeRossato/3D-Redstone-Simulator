<?php

<?php

$memcache = new Google\AppEngine\Api\Memcache\Memcache();
# reset all
$memcache->flush();
echo "Flushed all memcache entries.";