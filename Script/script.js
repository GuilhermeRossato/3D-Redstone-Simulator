function placePlayer(x,y,z) {
	x = x || -32;
	y = y || 11;
	z = z || 32;

	player.controls.player.position.set(x,y,z);
	player.controls.player.rotation.y = -0.772;
	player.controls.player.children[0].rotation.x = -0.523
}