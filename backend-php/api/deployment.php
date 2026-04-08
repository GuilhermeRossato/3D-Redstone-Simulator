<?php

    $appVersionId = getenv('HTTP_X_APPENGINE_APPVERSIONID');

    echo "<script>" . PHP_EOL;
    echo "const appVersionId = " . json_encode($appVersionId) . ";" . PHP_EOL;
    echo "window.appVersionId = appVersionId;" . PHP_EOL;
    echo "</script>" . PHP_EOL;

    $fileList = [];
    $glob     = glob("../**");
    foreach ($glob as $file) {
    array_push($fileList, $file);
    }
    error_log("Files in parent directory: " . implode(", ", $fileList));

    echo "<script>" . PHP_EOL;
    echo "const fileList = " . json_encode($fileList) . ";" . PHP_EOL;
    echo "window.fileList = fileList;" . PHP_EOL;
    echo "</script>" . PHP_EOL;

?>
<script>
  console.log("App Version ID:", window.appVersionId);
  console.log("Files in parent directory:", window.fileList);
</script>
<a href="flush.php?ret=deployment.php">Flush Memcache</a>
<pre>
<div><span>App Version Date:</span><span></span></div>
<div><span>Now Current Date:</span><span></span></div>
<div><span>Elapsed seconds:</span><span></span></div>
<div><span>Interval:</span><span></span></div>
 </pre>
<script>
  function updateTimeInfo() {
    window.updateText();
  }
  window.updateText = function () {
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

    document.querySelector("div:nth-child(1) span:nth-child(2)").textContent = formatDate(appVersionDate);
    document.querySelector("div:nth-child(2) span:nth-child(2)").textContent = formatDate(now);
    document.querySelector("div:nth-child(3) span:nth-child(2)").textContent = elapsedSeconds;
    document.querySelector("div:nth-child(4) span:nth-child(2)").textContent = "N/A";
  }

  // Make it "yyyy-mm-dd hh:mm:ss" in local timezone
  function formatDate(date) {
    return date instanceof Date && !isNaN(date) ?
      date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, '0') + "-" +
      String(date.getDate()).padStart(2, '0') + " " +
      String(date.getHours()).padStart(2, '0') + ":" +
      String(date.getMinutes()).padStart(2, '0') + ":" +
      String(date.getSeconds()).padStart(2, '0')
      : "Invalid Date";
  }

  updateTimeInfo();
  setInterval(updateTimeInfo, 1000);
</script>