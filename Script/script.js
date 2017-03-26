function getHeightAt(x, z) {
	return (perlin(x / 30, z / 29) + 1) * 4.5;
}

function generateArea(pos, side) {
	let i, j;
	var map = new Uint8Array(side * side);
	for (i = 0; i < side; i++) {
		for (j = 0; j < side; j++) {
			let height = getHeightAt(i+pos.z, j+pos.x);
			map[i + j * side] = height;
		}
	}
	return map;
}

function placePlayer(x,y,z) {
	x = x || -32;
	y = y || 11;
	z = z || 32;

	player.controls.player.position.set(x,y,z);
	player.controls.player.rotation.y = -0.772;
	player.controls.player.children[0].rotation.x = -0.523
}

world.generate();