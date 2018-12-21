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
			this.texture.magFilter = THREE.NearestFilter;
			this.texture.wrapS = THREE.RepeatWrapping;
			this.texture.wrapT = THREE.RepeatWrapping;
			this.texture.minFilter = THREE.NearestFilter;
			this.material = new THREE.MeshBasicMaterial({map: this.texture});
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
		x = x*t;
		y = y*t;
		var args = [x, -y, x, -t-y, t+x, -y, x, -t-y, t+x, -t-y, t+x, -y];
		uvs[0][0].set(args[0], args[1]);
		uvs[0][1].set(args[2], args[3]);
		uvs[0][2].set(args[4], args[5]);
		uvs[1][0].set(args[6], args[7]);
		uvs[1][1].set(args[8], args[9]);
		uvs[1][2].set(args[10], args[11]);
		if (!this.cache[x]) {
			this.cache[x] = [];
		}
		this.cache[x][y] = geometry;
	}
	load() {
		return new Promise((resolve, reject) => {
			const assetFilename = "../assets/textures.png";
			this.loader = new THREE.TextureLoader();
			this.texture = this.loader.load(
				assetFilename,
				resolve,
				undefined,
				reject.bind(this, new Error("Could not load asset \""+assetFilename+"\""))
			);
		});
		/*
		this.data.forEach(block => {
			for (const key in block.texture.children) {
				const value = block.texture.children[key];
				if (typeof value === "string") {
					filenames.add(value);
				} else {
					filenames.add(...value);
				}
			}
		});
*/
		/*
		this.data.forEach(block => {

		});
		for (var property in this.data) {
			const value = this.data[property];
		}

		var tList, propertyType;
		tList = [];
		function addUniqueTexture(fileName) {
			if (tList.indexOf(fileName) === -1)
				tList.push(fileName);
		}
		this.forEachPropertyInObject(blockList, (property,value)=>{
			propertyType = typeof value.texture;
			if (propertyType === "object") {
				this.forEachPropertyInObject(value.texture, (side,textureName)=>{
					if (typeof textureName === "string")
						addUniqueTexture(textureName);
				}
				);
			} else if (propertyType === "string") {
				addUniqueTexture(value.texture);
			}
		}
		);
		ImageLoader.on("done", ev=>this.handleFinishedImages(ev));
		this.imageList = ImageLoader.loadImageList(tList.map(fileName => "Images/Textures/"+fileName));
		this.textureList = tList;
		*/
	}
}