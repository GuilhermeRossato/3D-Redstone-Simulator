<?php

$lineBreak = "\n";

$no_ssao_text_path = "./no-ssao-text.png";
$ssao_text_path = "./ssao-text.png";

$no_ssao_img = imagecreatefrompng($no_ssao_text_path);
$ssao_img = imagecreatefrompng($ssao_text_path);
imagesavealpha($no_ssao_img, true);
imagesavealpha($ssao_img, true);

$i = 0;
for ($i=0;$i<1000;$i++) {
	$number_string = ($i<10)?"00".$i:($i<100?"0".$i:$i);
	$img1_path = './no-ssao/img'.$number_string.'-no-ssao.png';
	$img2_path = './ssao/img'.$number_string.'-ssao.png';
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

	$merged_width  = ($img1_width + $img2_width)/2;
	$merged_height = $img1_height > $img2_height ? $img1_height : $img2_height;

	$merged_image = imagecreatetruecolor($merged_width, $merged_height);

	imagealphablending($merged_image, true);
	imagesavealpha($merged_image, true);

	$img1 = imagecreatefrompng($img1_path);
	$img2 = imagecreatefrompng($img2_path);
	// place left image
	imagecopyresampled($merged_image, $img1, 0, 0, 0, 0, $img1_width/2, $img1_height, $img1_width/2, $img1_height);
	//place right
	imagecopyresampled($merged_image, $img2, $img1_width/2, 0, $img2_width/2, 0, $img2_width, $img2_height, $img2_width, $img2_height);

	// place left text
	imagecopyresampled($merged_image, $no_ssao_img, 0, 0, 0, 0, $img2_width/2, 127, $img2_width/2, 127);
	// place right text
	imagecopyresampled($merged_image, $ssao_img, $img1_width/2, 0, 0, 0, $img2_width/2, 127, $img2_width/2, 127);

    $save_path = $out_path;
    imagepng($merged_image,$save_path);
    echo $save_path."".$lineBreak."";
	// show file to browser like so:
	//header('Content-Type: image/png');
	//imagepng($merged_image);

	//release memory
	imagedestroy($merged_image);
	imagedestroy($img1);
	imagedestroy($img2);
}

imagedestroy($no_ssao_img);
imagedestroy($ssao_img);