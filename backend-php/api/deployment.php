<?php

$appVersionId = getenv('HTTP_X_APPENGINE_APPVERSIONID');
$i = strpos($appVersionId, '20');
if ($i === false || $i === 0) {
  error_log("Unexpected app version ID format: " . $appVersionId);
  $versionInfo = [
    "date"     => "",
    "elapsed"  => 0,
    "interval" => 0,
  ];
} else {
  $dateTime = "20" . substr($appVersionId, $i + 2);
  $yyyy     = substr($dateTime, 0, 4);
  $mm       = substr($dateTime, 4, 2);
  $dd       = substr($dateTime, 6, 2);
  $hh       = substr($dateTime, 9, 2);
  $min      = substr($dateTime, 11, 2);
  $ss       = substr($dateTime, 13, 2);

  $versionDate     = "$yyyy-$mm-$dd $hh:$min:$ss";
  $versionDateTime = new DateTime($versionDate, new DateTimeZone('America/Sao_Paulo')); // Assuming UTC-3 is Sao Paulo time
  $now             = new DateTime('now', new DateTimeZone('UTC'));

  $diff = $now->getTimestamp() - $versionDateTime->getTimestamp();

  $interval = $now->diff($versionDateTime);
  $ff       = $interval->format('%d.%H:%I:%S');
  if (str_starts_with($ff, '0.')) {
    $ff = substr($ff, 2);
  }
  $versionInfo = [
    "date"     => $versionDateTime->format('Y-m-d H:i:s P'),
    "elapsed"  => (float) $diff,
    "interval" => $ff,
  ];
}

// dump to error log as raw data
error_log("App Version ID: " . $appVersionId);
error_log("Version Date: " . $versionInfo['date']);
error_log("Elapsed seconds: " . $versionInfo['elapsed']);
error_log("Interval: " . $versionInfo['interval']);
echo "<h4>Version Information:</h4>" . PHP_EOL;
echo "<div>Version Id: " . $appVersionId . PHP_EOL . "</div>" . PHP_EOL;
echo "<pre>";
echo "App Version Date: " . $versionInfo['date'] . "\n";
echo "Now Current Date: " . (new DateTime('now'))->format('Y-m-d H:i:s P') . "\n";
echo "Elapsed seconds: " . $versionInfo['elapsed'] . PHP_EOL;
echo "Interval: " . $versionInfo['interval'] . PHP_EOL;
echo "</pre>";
echo "<script>" . "setInterval(() => {" . "  const pre = document.querySelector('pre');" . "  const date = pre.textContent.split('App Version Date: ')[1].split('\\n').shift().trim();" . "  const elapsed = Math.floor((Date.now() - new Date(date).getTime()) / 1000);" . "  const interval = new Date(elapsed * 1000).toISOString().substr(11, 8);" . "  pre.textContent = \"Deployment date: \" + date + \"\\nElapsed seconds: \" + elapsed + \"\\nInterval: \" + interval;" . "}, 1000);" . "</script>";
$routestr = "";
// list api routes with glob
foreach (glob("*.php") as $file) {
  if ($file === "index.php" || $file === "deployment.php") {
    continue;
  }
  $routestr .= $file . ",";
}
$list     = explode(",", $routestr);
echo "<h4>Available Routes:</h4>" . PHP_EOL;
foreach ($list as $route) {
  echo "<br><a href='" . htmlentities($route) . "'>" . $route . "</a>" . PHP_EOL;
}
