'use strict';

import * as THREE from '../../libs/three.module.js';
import TextureService from '../../graphics/TextureService.js';
import GraphicsEngine from '../../graphics/GraphicsEngine.js';
import BlockData from '../../data/BlockData.js';

const SIDE_DISPLACEMENT = [
	{"name": "Front",	"origin": [2, 1],	"rotation": [1, -0],		"inverse": [0, 0, -1],	"inverseId": 1},
	{"name": "Back",	"origin": [2, -1],	"rotation": [1, -2],		"inverse": [0, 0, 1],	"inverseId": 0},
	{"name": "Right",	"origin": [0, 1],	"rotation": [1, -1],		"inverse": [-1, 0, 0],	"inverseId": 3}, // ok
	{"name": "Left",	"origin": [0, -1],	"rotation": [1, 1],	"inverse": [1, 0, 0],	"inverseId": 2},
	{"name": "Top",		"origin": [1, 1],	"rotation": [0, 1],	"inverse": [0, -1, 0],	"inverseId": 5},
	{"name": "Bottom",	"origin": [1, -1],	"rotation": [0, -1],		"inverse": [0, 1, 0],	"inverseId": 4}
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
	_buildMesh() {
		if (this.mesh) {
			if (this.mesh.parent) {
				this.mesh.parent.remove(this.mesh);
			}
			this.mesh.dispose();
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
		const arrayRot = new Float32Array(planeCount * 3);
		const arrayTile = new Float32Array(planeCount * 2);

		for(let i = this.blockList.length-1; i >= 0; i--) {
			for (let j = 0; j < 6; j++) {
				arrayPos[i * 6 + j * 3 + 0] = this.blockList[i].x;
				arrayPos[i * 6 + j * 3 + 1] = this.blockList[i].y;
				arrayPos[i * 6 + j * 3 + 2] = this.blockList[i].z;
				arrayPos[i * 6 + j * 3 + SIDE_DISPLACEMENT[j].origin[0]] += SIDE_DISPLACEMENT[j].origin[1]/2;
				arrayRot[i * 6 + j * 3 + 0] = 0;
				arrayRot[i * 6 + j * 3 + 1] = 0;
				arrayRot[i * 6 + j * 3 + 2] = 0;
				arrayRot[i * 6 + j * 3 + SIDE_DISPLACEMENT[j].rotation[0]] += SIDE_DISPLACEMENT[j].rotation[1];
				arrayTile[i * 6 + j * 2 + 0] = this.blockList[i].texture[j].x;
				arrayTile[i * 6 + j * 2 + 1] = this.blockList[i].texture[j].y;
			}
		}

		const attributePos = new THREE.InstancedBufferAttribute(arrayPos, 3);
		instanced.addAttribute("instancePosition", attributePos);

		const attributeRotation = new THREE.InstancedBufferAttribute(arrayRot, 3);
		instanced.addAttribute("instanceRotation", attributeRotation);

		const attributeTile = new THREE.InstancedBufferAttribute(arrayTile, 2);
		instanced.addAttribute("instanceTile", attributeTile);

		const mesh = new THREE.Mesh(instanced, material);
		mesh.position.set(this.cx * 16, this.cy * 16, this.cz * 16);
		scene.add(mesh);

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
		this.blockList.push({ x, y, z, texture });
	}
}