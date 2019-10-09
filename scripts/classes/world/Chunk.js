'use strict';

import TextureService from '../../graphics/TextureService.js';

const SIDE_DISPLACEMENT = [
	{"name": "Front",	"origin": ["z", 1],		"rotation": ["y", 0],		"inverse": [0, 0, -1],	"inverseId": 1},
	{"name": "Back",	"origin": ["z", -1],	"rotation": ["y", 1],		"inverse": [0, 0, 1],	"inverseId": 0},
	{"name": "Right",	"origin": ["x", 1],		"rotation": ["y", 0.5],		"inverse": [-1, 0, 0],	"inverseId": 3},
	{"name": "Left",	"origin": ["x", -1],	"rotation": ["y", -0.5],	"inverse": [1, 0, 0],	"inverseId": 2},
	{"name": "Top",		"origin": ["y", 1],		"rotation": ["x", -0.5],	"inverse": [0, -1, 0],	"inverseId": 5},
	{"name": "Bottom",	"origin": ["y", -1],	"rotation": ["x", 0.5],		"inverse": [0, 1, 0],	"inverseId": 4}
];

export default class Chunk {
	construct(cx, cy, cz) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.blocks = [];
		this.blockList = [];
		this.geometry = undefined;
	}
	rebuildMesh() {
		const primitive = new THREE.PlaneGeometry(1,1,1,1);
		this.material = TextureService.getMaterial();
	}
	updateMesh() {
		
	}
	set(x, y, z, id) {
		if (id === 0) {
			this.clearBlock(x, y, z);
			this.rebuildMesh();
		} else if (this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]) {
			this.replaceBlock(x, y, z, id);
			this.rebuildMesh();
		} else {
			this.addBlock(x, y, z, id);
			this.updateMesh();
		}
	}
	clearBlock(x, y, z) {

	}
	replaceBlock(x, y, z, id) {

	}
	addBlock(x, y, z, id) {

	}
}