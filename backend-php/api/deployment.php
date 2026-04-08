<?php

$appVersionId = getenv('HTTP_X_APPENGINE_APPVERSIONID');

echo "<script>".PHP_EOL;
echo "const appVersionId = " . json_encode($appVersionId) . ";".PHP_EOL;
echo "window.appVersionId = appVersionId;".PHP_EOL;
echo "</script>".PHP_EOL;

$fileList = [];
$glob = glob("../**");
foreach ($glob as $file) {
  array_push($fileList, $file);
}
error_log("Files in parent directory: " . implode(", ", $fileList));

echo "<script>".PHP_EOL;
echo "const fileList = " . json_encode($fileList) . ";".PHP_EOL;
echo "window.fileList = fileList;".PHP_EOL;
echo "</script>".PHP_EOL;

?>
<script>
  console.log("App Version ID:", window.appVersionId);
  console.log("Files in parent directory:", window.fileList);
</script>
<pre>
<div><span>App Version Date:</span><span></span></div>
<div><span>Now Current Date:</span><span></span></div>
<div><span>Elapsed seconds:</span><span></span></div>
<div><span>Interval:</span><span></span></div>
 </pre>
<script>
  function updateTimeInfo() {
    const appVersionId = window.appVersionId;
    const fileList = window.fileList;

    // Extract timestamp from appVersionId
    const timestampMatch = appVersionId.match(/(\d{8}t\d{6})/i);
    let appVersionDate = "Unknown";
    if (timestampMatch) {
      const timestampStr = timestampMatch[1];
      const year = parseInt(timestampStr.substring(0, 4));
      const month = parseInt(timestampStr.substring(4, 6)) - 1; // Months are 0-based
      const day = parseInt(timestampStr.substring(6, 8));
      const hour = parseInt(timestampStr.substring(9, 11));
      const minute = parseInt(timestampStr.substring(11, 13));
      const second = parseInt(timestampStr.substring(13, 15));
      appVersionDate = new Date(year, month, day, hour, minute, second);
    }

    const now = new Date();
    const elapsedSeconds = appVersionDate !== "Unknown" ? Math.floor((now - appVersionDate) / 1000) : "Unknown";

    document.querySelector("div:nth-child(1) span:nth-child(2)").textContent = appVersionDate;
    document.querySelector("div:nth-child(2) span:nth-child(2)").textContent = now.toString();
    document.querySelector("div:nth-child(3) span:nth-child(2)").textContent = elapsedSeconds;
    document.querySelector("div:nth-child(4) span:nth-child(2)").textContent = "N/A";
  }

  updateTimeInfo();
  setInterval(updateTimeInfo, 1000);
</script>