'use strict';

import * as THREE from '../../libs/three.module.js';
import TextureService from '../../graphics/TextureService.js';
import GraphicsEngine from '../../graphics/GraphicsEngine.js';
import BlockData from '../../data/BlockData.js';

const SIDE_DISPLACEMENT = [
	{"name": "Front",	"origin": [2, 1],	"rotation": 0,		"inverse": [0, 0, -1],	"inverseId": 1, lightness: 0.784},
	{"name": "Back",	"origin": [2, -1],	"rotation": 1,		"inverse": [0, 0, 1],	"inverseId": 0, lightness: 0.792},
	{"name": "Right",	"origin": [0, 1],	"rotation": 2,		"inverse": [-1, 0, 0],	"inverseId": 3, lightness: 0.592}, // ok
	{"name": "Left",	"origin": [0, -1],	"rotation": 3,		"inverse": [1, 0, 0],	"inverseId": 2, lightness: 0.592},
	{"name": "Top",		"origin": [1, 1],	"rotation": 4,		"inverse": [0, -1, 0],	"inverseId": 5, lightness: 0.976},
	{"name": "Bottom",	"origin": [1, -1],	"rotation": 5,		"inverse": [0, 1, 0],	"inverseId": 4, lightness: 0.506}
];

const primitive = new THREE.PlaneBufferGeometry(1, 1);

export default class Chunk {
	constructor(world, cx, cy, cz) {
		this.world = world;
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.blocks = [];
		this.blockList = [];
		this.mesh = undefined;
	}
	assignTo(scene) {
		this.scene = scene;
		if (this.blockList.length !== 0) {
			return this._rebuildMesh();
		}
		return null;
	}
	isSolidBlock(x, y, z) {
		const external = this.world.isSolidBlock(x + this.cx * 16, y + this.cy * 16, z + this.cz * 16);
		if (x >= 0 && x < 16 && y >= 0 && y < 16 && z >= 0 && z < 16) {
			if (x === 0 & y === 0 && z === 2 && external) {
				debugger;
			}
			const internal = !!(this.blocks && this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]);
			if (internal !== external) {
				debugger;
				this.world.isSolidBlock(x + this.cx * 16, y + this.cy * 16, z + this.cz * 16);
			}
			return internal;
		}
		return external;
	}
	_getOcclusion(position, side) {
		let t, tr, r, br, b, bl, l, tl;

		if (side === 0) {
			t = this.isSolidBlock(position.x, position.y+1, position.z+1);
			r = this.isSolidBlock(position.x+1, position.y, position.z+1);
			b = this.isSolidBlock(position.x, position.y-1, position.z+1);
			l = this.isSolidBlock(position.x-1, position.y, position.z+1);
			tr = this.isSolidBlock(position.x+1, position.y+1, position.z+1);
			br = this.isSolidBlock(position.x+1, position.y-1, position.z+1);
			bl = this.isSolidBlock(position.x-1, position.y-1, position.z+1);
			tl = this.isSolidBlock(position.x-1, position.y+1, position.z+1);
		} else if (side === 1) {
			t = this.isSolidBlock(position.x, position.y+1, position.z-1);
			r = this.isSolidBlock(position.x-1, position.y, position.z-1);
			b = this.isSolidBlock(position.x, position.y-1, position.z-1);
			l = this.isSolidBlock(position.x+1, position.y, position.z-1);
			tr = this.isSolidBlock(position.x-1, position.y+1, position.z-1);
			br = this.isSolidBlock(position.x-1, position.y-1, position.z-1);
			bl = this.isSolidBlock(position.x+1, position.y-1, position.z-1);
			tl = this.isSolidBlock(position.x+1, position.y+1, position.z-1);
		} else if (side === 2) {
			t = this.isSolidBlock(position.x+1, position.y+1, position.z);
			r = this.isSolidBlock(position.x+1, position.y, position.z-1);
			b = this.isSolidBlock(position.x+1, position.y-1, position.z);
			l = this.isSolidBlock(position.x+1, position.y, position.z+1);
			tr = this.isSolidBlock(position.x+1, position.y+1, position.z-1);
			br = this.isSolidBlock(position.x+1, position.y-1, position.z-1);
			bl = this.isSolidBlock(position.x+1, position.y-1, position.z+1);
			tl = this.isSolidBlock(position.x+1, position.y+1, position.z+1);
		} else if (side === 3) {
			t = this.isSolidBlock(position.x-1, position.y+1, position.z);
			r = this.isSolidBlock(position.x-1, position.y, position.z+1);
			b = this.isSolidBlock(position.x-1, position.y-1, position.z);
			l = this.isSolidBlock(position.x-1, position.y, position.z-1);
			tr = this.isSolidBlock(position.x-1, position.y+1, position.z+1);
			br = this.isSolidBlock(position.x-1, position.y-1, position.z+1);
			bl = this.isSolidBlock(position.x-1, position.y-1, position.z-1);
			tl = this.isSolidBlock(position.x-1, position.y+1, position.z-1);
		} else if (side === 4) {
			t = this.isSolidBlock(position.x, position.y+1, position.z-1);
			r = this.isSolidBlock(position.x+1, position.y+1, position.z);
			b = this.isSolidBlock(position.x, position.y+1, position.z+1);
			l = this.isSolidBlock(position.x-1, position.y+1, position.z);
			tr = this.isSolidBlock(position.x+1, position.y+1, position.z-1);
			br = this.isSolidBlock(position.x+1, position.y+1, position.z+1);
			bl = this.isSolidBlock(position.x-1, position.y+1, position.z+1);
			tl = this.isSolidBlock(position.x-1, position.y+1, position.z-1);
		} else if (side === 5) {
			t = this.isSolidBlock(position.x, position.y-1, position.z+1);
			r = this.isSolidBlock(position.x+1, position.y-1, position.z);
			b = this.isSolidBlock(position.x, position.y-1, position.z-1);
			l = this.isSolidBlock(position.x-1, position.y-1, position.z);
			tr = this.isSolidBlock(position.x+1, position.y-1, position.z+1);
			br = this.isSolidBlock(position.x+1, position.y-1, position.z-1);
			bl = this.isSolidBlock(position.x-1, position.y-1, position.z-1);
			tl = this.isSolidBlock(position.x-1, position.y-1, position.z+1);
		} else {
			return 0;
		}

		return t + r * 2 + b * 4 + l * 8 + tr * 16 + br * 32 + bl * 64 + tl * 128;
	}

	_buildMesh(skipAo = false) {
		if (this.blockList.length === 0) {
			return;
		}
		console.log("Building chunk ", this.cx, this.cy, this.cz);
		if (this.mesh) {
			if (this.mesh.parent) {
				this.mesh.parent.remove(this.mesh);
			}
			if (this.instanced) {
				this.instanced.dispose();
			}
		}
		const material = GraphicsEngine.getMaterial();
		const geometry = primitive;

		if (!material || !geometry) {
			return console.warn("Could not generate chunk mesh");
		}

		const instanced = new THREE.InstancedBufferGeometry();
		instanced.attributes.position = geometry.attributes.position;
		instanced.attributes.uv = geometry.attributes.uv;
		instanced.index = geometry.index;
		instanced.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 17);

		const planeCount = this.blockList.length * 6;

		const arrayPos = new Float32Array(planeCount * 3);
		const arrayVisual = new Float32Array(planeCount * 3);
		const arrayTile = new Float32Array(planeCount * 2);

		let i1 = 0, i2 = 0, i3 = 0;
		for(let i = this.blockList.length-1; i >= 0; i--) {
			for (let j = 0; j < 6; j++) {
				arrayPos[i1++] = this.blockList[i].x;
				arrayPos[i1++] = this.blockList[i].y;
				arrayPos[i1++] = this.blockList[i].z;
				arrayPos[(i1 - 3) + SIDE_DISPLACEMENT[j].origin[0]] += SIDE_DISPLACEMENT[j].origin[1]/2;
				arrayVisual[i2++] = SIDE_DISPLACEMENT[j].rotation;
				arrayVisual[i2++] = SIDE_DISPLACEMENT[j].lightness;
				arrayVisual[i2++] = skipAo ? 0 : this._getOcclusion(this.blockList[i], j);
				arrayTile[i3++] = this.blockList[i].texture[j].x;
				arrayTile[i3++] = this.blockList[i].texture[j].y;
			}
		}

		const attributePos = new THREE.InstancedBufferAttribute(arrayPos, 3);
		instanced.addAttribute("instancePosition", attributePos);

		const attributeRotation = new THREE.InstancedBufferAttribute(arrayVisual, 3);
		instanced.addAttribute("instanceVisual", attributeRotation);

		const attributeTile = new THREE.InstancedBufferAttribute(arrayTile, 2);
		instanced.addAttribute("instanceTile", attributeTile);

		const mesh = new THREE.Mesh(instanced, material);
		mesh.position.set(this.cx * 16, this.cy * 16, this.cz * 16);

		this.instanced = instanced;
		this.mesh = mesh;
		return mesh;
	}
	_rebuildMesh() {
		//console.log("Rebuilding chunk ", this.cx, this.cy, this.cz);
		const parent = this.scene;
		if (!parent) {
			return null;
		}
		const mesh = this._buildMesh();
		if (!mesh) {
			//console.log("Discarting chunk");
			return;
		}
		parent.add(mesh);
		return mesh;
	}
	set(x, y, z, id) {
		let result = 0;
		if (id === 0) {
			this.clearBlock(x, y, z);
			result = 1;
		} else if (this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]) {
			if (!BlockData[id]) {
				throw new Error(`Block id ${id} does not exist on BlockData`);
			}
			this.replaceBlock(x, y, z, id);
			result = 0;
		} else {
			if (!BlockData[id]) {
				throw new Error(`Block id ${id} does not exist on BlockData`);
			}
			this.addBlock(x, y, z, id);
			result = 1;
		}
		this._rebuildMesh();
		return result;
	}
	get(x, y, z) {
		return this.blocks[z] && this.blocks[z][x] ? this.blocks[z][x][y] : null;
	}
	clearBlock(x, y, z) {

	}
	replaceBlock(x, y, z, id) {
		this.blocks[z][x][y].texture = BlockData[id].texture;
	}
	addBlock(x, y, z, id) {
		const texture = BlockData[id].texture;
		const blockObj = { x, y, z, texture };
		if (!this.blocks[z]) {
			this.blocks[z] = [];
		}
		if (!this.blocks[z][x]) {
			this.blocks[z][x] = [];
		}
		this.blocks[z][x][y] = blockObj;
		this.blockList.push(blockObj);
	}
}