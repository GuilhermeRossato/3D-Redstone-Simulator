<?php

$folderName = "saved_files";

if (substr($_SERVER["REQUEST_URI"], -4) === ".png") {
	header ("Content-type: image/png");
	$im = @imagecreatetruecolor(150, 100) or die("Cannot Initialize new GD image stream");
	$text_color = imagecolorallocate($im, 233, 14, 91);
	imagestring($im, 1, 5, 5,  "A Simple Text String", $text_color);
	imagepng($im);
	imagedestroy($im);
	die();
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
	?>
	<html>
		<head>
    		<meta charset="UTF-8">
    		<title>Save Server Test Form</title>
		</head>
		<body>
			<style>
				label {
					display: inline-block;
					width: 80px;
					margin: 5px;
				}
			</style>
			<p>Test the save server here, write a filename and click a few places in the canvas to create an image, then submit to test if the PHP backend can save the file correctly.</p>
			<form method="POST">
				<label>Filename</label>
				<input type="text" name="filename" />
				<br>
				<label>Content</label>
				<input type="hidden" name="content" value="" />
				<canvas>No canvas support</canvas>
				<br>
				<input type="submit" value='Submit' />
			</form>
			<script>
				document.querySelector("form").onsubmit = function(event) {
					document.querySelector("input[name='content']").value = document.querySelector("canvas").toDataURL();
				}
				document.querySelector("canvas").onmousedown = function(event) {
					window.ctx.fillRect(event.offsetX, event.offsetY, 10, 10);
					window.last_down = performance.now();
				}
				document.querySelector("canvas").onmousemove = function(event) {
					const now = performance.now();
					const last = window.last_down;
					if (now-last < 400) {
						var radius = (1-(now-last)/400)*10;
						window.ctx.fillRect(event.offsetX, event.offsetY, radius, radius);
					}
				}
				window.ctx = document.querySelector("canvas").getContext("2d");
				window.ctx.strokeRect(1, 1, document.querySelector("canvas").width-2, document.querySelector("canvas").height-2)
			</script>
		</body>
	</html>
	<?php
} else {
	header('Access-Control-Allow-Origin: *');
	echo "<meta charset=\"UTF-8\"><pre>";
	try {
		echo json_encode(reply_post($_POST));
	} catch (Exception $e) {
		echo json_encode(["error" => "true", "message" => $e->getMessage()]);
	}
	echo "</pre>";
}

function reply_post($data) {
	global $folderName;

	if (file_exists($folderName) && !is_dir($folderName)) {
		throw new Exception("Cannot create directory ".$folderName.". There's a file there");
	}
	if (!file_exists($folderName)) {
		mkdir($folderName);
	}
	if (empty($data["filename"])) {
		throw new Exception("Missing 'filename' parameter");
	}
	if (empty($data["content"])) {
		throw new Exception("Missing 'content' parameter");
	}
	$filename = $data["filename"];
	$content = $data["content"];
	if (strpos($content, "data:image/png;base64,") === 0) {
		$content = substr($content, strlen("data:image/png;base64,"));
		$content = str_replace(' ', '+', $content);
		if (substr($filename, -4) !== ".png") {
			$filename .= ".png";
		}
	}
	if (strpos($content, "data:image/jpg;base64,") === 0) {
		$content = substr($content, strlen("data:image/jpg;base64,"));
		$content = str_replace(' ', '+', $content);
		if (substr($filename, -4) !== ".jpg") {
			$filename .= ".jpg";
		}
	}

	$content = base64_decode($content);
	$finalFilename = $folderName.DIRECTORY_SEPARATOR.$filename;
	$overwritten = file_exists($finalFilename);
	$bytes = file_put_contents($finalFilename, $content);
	return ["success" => "true", "bytes_written" => $bytes, "filename" => $filename, "overwritten" => $overwritten];
}