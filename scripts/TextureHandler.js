'use strict';

import BlockData from '../scripts/data/BlockData.js';
import * as THREE from './libs/three.module.js';

export default class WorldHandler {
	constructor(worldHandler) {
		this.handler = worldHandler;
		this.data = BlockData;
		this.cache = [];
	}
	getMaterial() {
		if (!this.material) {
			this.texture.wrapS = THREE.RepeatWrapping;
			this.texture.wrapT = THREE.RepeatWrapping;
			this.texture.magFilter = THREE.NearestFilter;
			this.texture.minFilter = THREE.LinearFilter;
			this.material = new THREE.MeshLambertMaterial({
				map: this.texture,
				color: 0x555555
			});
		}
		return this.material;
	}
	getCachedResult(x, y, defaultValue=false) {
		if (!this.cache[x] || !this.cache[x][y]) {
			return defaultValue;
		}
		return this.cache[x][y];
	}
	applyUv(geometry, x, y) {
		const uvs = geometry.faceVertexUvs[0];
		window.geometry = geometry;
		const t = 1/8;
		x = x*t+(1+x*2)/16*t;
		y = y*t+(1+y*2)/16*t;
		var args = [x, -y, x, -t-y, t+x, -y, x, -t-y, t+x, -t-y, t+x, -y];
		const m = 0.0003;
		uvs[0][0].set(args[0]+m, args[1]-m); //-
		uvs[0][1].set(args[2]+m, args[3]+m);
		uvs[0][2].set(args[4]-m, args[5]-m); //-
		uvs[1][0].set(args[6]+m, args[7]+m); //+
		uvs[1][1].set(args[8]-m, args[9]+m); //+
		uvs[1][2].set(args[10]-m, args[11]-m);
		(!this.cache[x]) && (this.cache[x] = [])
		this.cache[x][y] = geometry;
	}
	load() {
		return new Promise((resolve, reject) => {
			//const assetFilename = "../assets/textures.png";
			const assetFilename = "../assets/textures_separated.png"
			this.loader = new THREE.TextureLoader();
			this.texture = this.loader.load(
				assetFilename,
				resolve,
				undefined,
				reject.bind(this, new Error("Could not load asset \""+assetFilename+"\""))
			);
		});
	}
}