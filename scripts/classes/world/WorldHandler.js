'use strict';

import TextureHandler from '../../TextureHandler.js';
import * as THREE from '../../libs/three.module.js';

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

	load() {
		this.textures = new TextureHandler(this);
		this.textures.load();
	}

	set(x, y, z, id) {

	}

	static get SIDE_DISPLACEMENT() {
		return [
			{"name": "Front",	"origin": ["z", 0.5],	"target": ["y", 0],		"displacement": [0, 0, -1]},
			{"name": "Back",	"origin": ["z", -0.5],	"target": ["y", 1],		"displacement": [0, 0, 1]},
			{"name": "Right",	"origin": ["x", 0.5],	"target": ["y", 0.5],	"displacement": [-1, 0, 0]},
			{"name": "Left",	"origin": ["x", -0.5],	"target": ["y", -0.5],	"displacement": [1, 0, 0]},
			{"name": "Top",		"origin": ["y", 0.5],	"target": ["x", -0.5],	"displacement": [0, -1, 0]},
			{"name": "Bottom",	"origin": ["y", -0.5],	"target": ["x", 0.5],	"displacement": [0, 1, 0]}
		];
	}
	static get GEOMETRIES() {
		return {
			"plane": new THREE.PlaneGeometry(1,1,1,1),
			"half": new THREE.PlaneGeometry(1,0.5,1,1),
			"quarter": new THREE.PlaneGeometry(1,0.25,1,1)
		}
	}
}