function repeat(n,f) {
	for (let i = 0 ; i < n ; i ++)
		f(i);
}

function range(a,b) {
	if (a > b) return range(b, a).reverse();
	var c = new Array(b-a);
	for (let i = a ; i <= b; i++)
		c[i-a] = i;
	return c;
}

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

var safeFloats = range(31,1).map(number => number.toString(2)).map(str => str.split('').reverse()).map((chars) => { var a = 0; chars.forEach((char, i)=>{ if (char==="1") { a += Math.pow(2,-(1+i)); }}); return a;}).sort((a,b)=>(a>b)?-1:(a<b)?1:0);