'use strict';

import TextureHandler from '../../TextureHandler.js';
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
		this.textures = new TextureHandler(this);
		await this.textures.load();
	}

	set(x, y, z, id) {
		const data = BlockData[id];
		const renderType = data.render;
		const material = this.textures.getMaterial();
		if (renderType === "simple") {
			const texture = data.texture.children[0];
			const geometry = this.textures.getCachedResult(texture.x, texture.y, this.geometries.plane);
			this.textures.applyUv(geometry, texture.x, texture.y);
			const faces = this.sidesDisplacement.map(side => {
				const mesh = new THREE.Mesh(geometry, material);
				mesh.matrixAutoUpdate = false;
				mesh.position.set((x|0), (y|0), (z|0));
				mesh.position[side.origin[0]] += side.origin[1]/2;
				mesh.rotation[side.target[0]] += side.target[1]*Math.PI;
				mesh.updateMatrix();
				return mesh;
			});
			this.scene.add(...faces);
		}
	}

	static get SIDE_DISPLACEMENT() {
		return [
			{"name": "Front",	"origin": ["z", 1],	"target": ["y", 0],		"displacement": [0, 0, -1]},
			{"name": "Back",	"origin": ["z", -1],	"target": ["y", 1],		"displacement": [0, 0, 1]},
			{"name": "Right",	"origin": ["x", 1],	"target": ["y", 0.5],	"displacement": [-1, 0, 0]},
			{"name": "Left",	"origin": ["x", -1],	"target": ["y", -0.5],	"displacement": [1, 0, 0]},
			{"name": "Top",		"origin": ["y", 1],	"target": ["x", -0.5],	"displacement": [0, -1, 0]},
			{"name": "Bottom",	"origin": ["y", -1],	"target": ["x", 0.5],	"displacement": [0, 1, 0]}
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