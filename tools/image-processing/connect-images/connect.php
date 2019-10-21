<?php

$lineBreak = "\n";

$left_text_path = "./left-text.png";
$right_text_path = "./right-text.png";

$left_img = imagecreatefrompng($left_text_path);
$right_img = imagecreatefrompng($right_text_path);
imagesavealpha($left_img, true);
imagesavealpha($right_img, true);

if (!file_exists("output")) {
	mkdir("output");
}

$i = 0;
for ($i=1;$i<202;$i++) {
	$number_string = ($i<10)?"00".$i:($i<100?"0".$i:$i);

	$img1_path = './left/img'.$number_string.'.png';
	$img2_path = './right/img'.$number_string.'.png';
	$out_path = './output/img'.$number_string.'.png';

	if (file_exists($img1_path) && file_exists($img2_path)) {
	} else {
		echo "File not found:".$lineBreak."".$img1_path."".$lineBreak." or ".$lineBreak."".$img2_path."".$lineBreak."";
		echo "The script will stop now ".$lineBreak."";
		sleep(2);
		break;
	}

	list($img1_width, $img1_height) = getimagesize($img1_path);
	list($img2_width, $img2_height) = getimagesize($img2_path);

	$merged_width  = ($img1_width + $img2_width);
	$merged_height = $img1_height > $img2_height ? $img1_height : $img2_height;

	$merged_height = 384;

	$merged_image = imagecreatetruecolor($merged_width, $merged_height);

	imagealphablending($merged_image, true);
	imagesavealpha($merged_image, true);

	$img1 = imagecreatefrompng($img1_path);
	$img2 = imagecreatefrompng($img2_path);
	// place left image
	$left_vertical_height = abs($merged_height - $img1_height) / 2;
	imagecopyresampled($merged_image, $img1, 0, 0, 0, $left_vertical_height, $img1_width, $img1_height - $left_vertical_height, $img1_width, $img1_height - $left_vertical_height);
	//place right
	$right_vertical_height = abs($merged_height - $img2_height) / 2;
	imagecopyresampled($merged_image, $img2, $img1_width, 0, 0, $right_vertical_height, $img2_width, $img2_height - $right_vertical_height, $img2_width, $img2_height - $right_vertical_height);

	// place left text
	imagecopyresampled($merged_image, $left_img, 0, 0, 0, 0, $img2_width, 127, $img2_width, 127);
	// place right text
	imagecopyresampled($merged_image, $right_img, $img1_width, 0, 0, 0, $img2_width, 127, $img2_width, 127);

    imagepng($merged_image, $out_path);
    echo $out_path."".$lineBreak."";
	// show file to browser like so:
	//header('Content-Type: image/png');
	//imagepng($merged_image);

	//release memory
	imagedestroy($merged_image);
	imagedestroy($img1);
	imagedestroy($img2);
}

imagedestroy($left_img);
imagedestroy($right_img);