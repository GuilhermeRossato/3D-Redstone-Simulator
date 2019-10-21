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
	constructor(cx, cy, cz) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.blocks = [];
		this.blockList = [];
		this.mesh = undefined;
	}
	assignTo(scene) {
		return this._rebuildMesh(scene);
	}
	isSolidBlock(x, y, z) {
		return !!(this.blocks && this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]);
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

		if (position.x === 0 && position.y === 0 && position.z === 0) {
			console.log(t + r * 2 + b * 4 + l * 8 + tr * 16 + br * 32 + bl * 64 + tl * 128, t+0, r * 2, b * 4, l * 8, tr * 16, br * 32, bl * 64, tl * 128);
		}

		return t + r * 2 + b * 4 + l * 8 + tr * 16 + br * 32 + bl * 64 + tl * 128;

		// side 2 bits
		// corners = 8 bits = 10 bits

		if (side === 4) {
			const
				right = this.isSolidBlock(position.x+1, position.y+1, position.z),
				left = this.isSolidBlock(position.x-1, position.y+1, position.z),
				bottom = this.isSolidBlock(position.x, position.y+1, position.z+1),
				top = this.isSolidBlock(position.x, position.y+1, position.z-1);
			if (right && left && bottom && top) {
				return 33;
			} else if (right && left && bottom && !top) {
				return 13;
			} else if (right && left && !bottom && top) {
				return 15;
			} else if (right && !left && bottom && top) {
				return 16;
			} else if (!right && left && bottom && top) {
				return 14;
			}
			const
				br = this.isSolidBlock(position.x+1, position.y+1, position.z+1),
				tr = this.isSolidBlock(position.x+1, position.y+1, position.z-1),
				bl = this.isSolidBlock(position.x-1, position.y+1, position.z+1),
				tl = this.isSolidBlock(position.x-1, position.y+1, position.z-1);
			if (!right && left && !bottom && top) {
				return br ? 17 : 10;
			} else if (right && !left && !bottom && top) {
				return bl ? 18 : 11;
			} else if (right && !left && bottom && !top) {
				return tl ? 19 : 12;
			} else if (!right && left && bottom && !top) {
				return tr ? 20 : 9;
			} else if (!right && left && !bottom && !top) {
				return tr ? 21 : (br ? 22 : 3);
			} else if (!right && !left && !bottom && top) {
				return bl ? 23 : (br ? 24 : 2);
			} else if (right && !left && !bottom && !top) {
				return bl ? 23 : (br ? 24 : 2);
			} else if (!right && !left && !bottom && !top && !br && tr && !bl && !tl) {
				return 0*7;
			} else if (!right && !left && !bottom && !top && br && !tr && !bl && !tl) {
				return 0*8;
			} else if (!right && !left && !bottom && !top && !br && !tr && bl && !tl) {
				return 0*5;
			} else if (!right && !left && !bottom && !top && !br && !tr && !bl && tl) {
				return 0*6;
			}
		}
		return 0;
	}

	_buildMesh(skipAo = false) {
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
				//const key = i1 - 3 + SIDE_DISPLACEMENT[j].origin[0];
				//console.log(key);
				//arrayPos[i1 - 3 + SIDE_DISPLACEMENT[j].origin[0]] += SIDE_DISPLACEMENT[j].origin[1]/2;
				//arrayPos[i * 3 + j * 6 + SIDE_DISPLACEMENT[j].origin[0]] += SIDE_DISPLACEMENT[j].origin[1]/2;
				arrayVisual[i2++] = SIDE_DISPLACEMENT[j].rotation;
				arrayVisual[i2++] = SIDE_DISPLACEMENT[j].lightness;

				arrayVisual[i2++] = skipAo ? 0 : this._getOcclusion(this.blockList[i], j);
				/*
				if (skipAo) {
					arrayVisual[i2++] = 0;
				} else if (j === 4) {
					const
						right = this.isSolidBlock(this.blockList[i].x+1, this.blockList[i].y+1, this.blockList[i].z),
						s2 = this.isSolidBlock(this.blockList[i].x-1, this.blockList[i].y+1, this.blockList[i].z),
						s3 = this.isSolidBlock(this.blockList[i].x, this.blockList[i].y+1, this.blockList[i].z+1),
						s4 = this.isSolidBlock(this.blockList[i].x, this.blockList[i].y+1, this.blockList[i].z-1);
					if (s1 && s2 && s3 && s4) {
						arrayVisual[i2++] = 17+4;
					} else if (s1 && s2 && s3 && !s4) {
						arrayVisual[i2++] = 13;
					} else if (s1 && s2 && !s3 && s4) {
						arrayVisual[i2++] = 15;
					} else if (s1 && !s2 && s3 && s4) {
						arrayVisual[i2++] = 16;
					} else if (!s1 && s2 && s3 && s4) {
						arrayVisual[i2++] = 14;
					} else if (!s1 && s2 && !s3 && s4) {
						arrayVisual[i2++] = 14;
					} else {
						arrayVisual[i2++] = 0;
					}
				} else {
					arrayVisual[i2++] = 0;
				}
				*/
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
		scene.add(mesh);

		this.instanced = instanced;
		this.mesh = mesh;
		return mesh;
	}
	_rebuildMesh(target) {
		const parent = target ? target : this.mesh.parent
		if (!parent) {
			return null;
		}
		const mesh = this._buildMesh();
		if (!mesh) {
			return console.warn("Could not generate chunk mesh");
		}
		parent.add(mesh);
		return mesh;
	}
	set(x, y, z, id) {
		if (id === 0) {
			this.clearBlock(x, y, z);
		} else if (this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]) {
			if (!BlockData[id]) {
				throw new Error(`Block id ${id} does not exist on BlockData`);
			}
			this.replaceBlock(x, y, z, id);
		} else {
			if (!BlockData[id]) {
				throw new Error(`Block id ${id} does not exist on BlockData`);
			}
			this.addBlock(x, y, z, id);
		}
		this.mesh && this._rebuildMesh();
	}
	clearBlock(x, y, z) {

	}
	replaceBlock(x, y, z, id) {

	}
	addBlock(x, y, z, id) {
		const data = BlockData[id];
		const texture = data.texture;
		const blockObj = { x, y, z, texture };
		if (!this.blocks[z]) {
			this.blocks[z] = [];
		}
		if (!this.blocks[z][x]) {
			this.blocks[z][x] = [];
		}
		this.blockList.push(this.blocks[z][x][y] = blockObj);
	}
}