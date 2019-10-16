'use strict';

import TextureService from '../../graphics/TextureService.js';
import * as THREE from '../../libs/three.module.js';
import BlockData from '../../data/BlockData.js';

export default class WorldHandler {
	constructor(graphicsEngine) {
		this.scene = graphicsEngine.scene;
		this.blocks = [];
		this.blockList = [];
		this.allFaces = [];
		this.faces = [];
		this.sidesDisplacement = WorldHandler.SIDE_DISPLACEMENT;
		this.geometries = WorldHandler.GEOMETRIES;
	}

	async load() {
		if (!TextureService.loaded) {
			await TextureService.load();
		}
	}

	clearBlock(x, y, z) {
		if (!this.blocks[x] || !this.blocks[x][y] || !!this.blocks[x][y][z]) {
			return true;
		}
		console.warn("Unimplemented clearBlock");
	}

	set(x, y, z, id) {
		var geometry, ix, iy, iz, i, side;
		if (id === 0) {
			return this.clearBlock(x, y, z);
		}
		const data = BlockData[id];
		const renderType = data.render;
		const material = TextureService.getMaterial();
		const block = {
			faces: undefined,
			id: id
		}
		if (renderType === "simple" || renderType === undefined) {
			const texture = data.texture[0];
			
			geometry = TextureService.getCachedResult(texture.x, texture.y);
			if (!geometry) {
				geometry = this.geometries.plane.clone();
				TextureService.applyUv(geometry, texture.x, texture.y);
			}
			block.faces = [];
			for (i=0;i<this.sidesDisplacement.length;i++) {
				side = this.sidesDisplacement[i];
				const mesh = new THREE.Mesh(geometry, material);
				mesh.matrixAutoUpdate = false;
				mesh.position.set((x|0), (y|0), (z|0));
				mesh.position[side.origin[0]] += side.origin[1]/2;
				mesh.rotation[side.rotation[0]] += side.rotation[1]*Math.PI;
				mesh.updateMatrix();
				// Face culling (hidden faces by other blocks)
				ix = x-side.inverse[0];
				iy = y-side.inverse[1];
				iz = z-side.inverse[2];
				if (this.blocks[ix] && this.blocks[ix][iz] && this.blocks[ix][iz][iy]) {
					mesh.visible = false;
					if (this.blocks[ix][iz][iy].faces.length === 6) {
						this.blocks[ix][iz][iy].faces[side.inverseId].visible = false;
					}
				}
				block.faces.push(mesh);
			}
			(!this.blocks[x]) && (this.blocks[x] = []);
			(!this.blocks[x][z]) && (this.blocks[x][z] = []);
			this.blocks[x][z][y] = block;
		} else {
			block.faces = [];
			console.warn("Ignored invalid render type: "+renderType);
		}
		this.blockList.push(block);
		this.scene.add(...block.faces);
	}

	static get SIDE_DISPLACEMENT() {
		return [
			{"name": "Front",	"origin": ["z", 1],		"rotation": ["y", 0],		"inverse": [0, 0, -1],	"inverseId": 1},
			{"name": "Back",	"origin": ["z", -1],	"rotation": ["y", 1],		"inverse": [0, 0, 1],	"inverseId": 0},
			{"name": "Right",	"origin": ["x", 1],		"rotation": ["y", 0.5],		"inverse": [-1, 0, 0],	"inverseId": 3},
			{"name": "Left",	"origin": ["x", -1],	"rotation": ["y", -0.5],	"inverse": [1, 0, 0],	"inverseId": 2},
			{"name": "Top",		"origin": ["y", 1],		"rotation": ["x", -0.5],	"inverse": [0, -1, 0],	"inverseId": 5},
			{"name": "Bottom",	"origin": ["y", -1],	"rotation": ["x", 0.5],		"inverse": [0, 1, 0],	"inverseId": 4}
		];
	}

	static get GEOMETRIES() {
		return {
			/*
			"plane": new THREE.PlaneGeometry(0.5,0.5,1,1),
			"half": new THREE.PlaneGeometry(0.5,0.25,1,1),
			"quarter": new THREE.PlaneGeometry(0.5,0.125,1,1)
			*/
			"plane": new THREE.PlaneGeometry(1,1,1,1),
			"half": new THREE.PlaneGeometry(1,0.5,1,1),
			"quarter": new THREE.PlaneGeometry(1,0.25,1,1)
		}
	}
}