<?php

$lineBreak = "\n";

$i = 0;
for ($i=0;$i<1000;$i++) {
	$numberStr = ($i<10)?"00".$i:($i<100?"0".$i:$i);
	$img1_path = './no-ssao/img'.$numberStr.'-no-ssao.png';
	$img2_path = './ssao/img'.$numberStr.'-ssao.png';
	$out_path = './output/img'.$numberStr.'.png';

	if (file_exists($img1_path) && file_exists($img2_path)) {
	} else {
		echo "Nao encontrado:".$lineBreak."".$img1_path."".$lineBreak." ou ".$lineBreak."".$img2_path."".$lineBreak."";
		echo "Fim".$lineBreak."";
		break;
	}

	list($img1_width, $img1_height) = getimagesize($img1_path);
	list($img2_width, $img2_height) = getimagesize($img2_path);

	$merged_width  = ($img1_width + $img2_width)/2;
	$merged_height = $img1_height > $img2_height ? $img1_height : $img2_height;

	$merged_image = imagecreatetruecolor($merged_width, $merged_height);

	imagealphablending($merged_image, false);
	imagesavealpha($merged_image, true);

	$img1 = imagecreatefrompng($img1_path);
	$img2 = imagecreatefrompng($img2_path);

	imagecopy($merged_image, $img1, 0, 0, 0, 0, $img1_width/2, $img1_height);
	//place at right side of $img1
	imagecopy($merged_image, $img2, $img1_width/2, 0, $img2_width/2, 0, $img2_width, $img2_height);

	//save file or output to broswer
	$SAVE_AS_FILE = TRUE;
	if ($SAVE_AS_FILE) {
	    $save_path = $out_path;
	    imagepng($merged_image,$save_path);
	    echo $save_path."".$lineBreak."";
	} else {
	    header('Content-Type: image/png');
	    imagepng($merged_image);
	}

	//release memory
	imagedestroy($merged_image);
}