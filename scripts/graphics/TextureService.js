'use strict';

import BlockData from '../data/BlockData.js';
import * as THREE from '../libs/three.module.js';

const baseTexturePath = "../assets/textures.png";

export default class TextureService {
	static getMaterial() {
		if (!this.material) {
			this.material = new THREE.MeshLambertMaterial({
				map: this.texture,
				color: 0x555555
			});
			this.material.side = THREE.FrontSide;
		}
		return this.material;
	}
	static getCachedResult(x, y, defaultValue=false) {
		if (!this.cache || !this.cache[x] || !this.cache[x][y]) {
			return defaultValue;
		}
		return this.cache[x][y];
	}
	static applyUv(geometry, xo, yo) {
		const uvs = geometry.faceVertexUvs[0];
		window.geometry = geometry;
		const t = 1/8;
		const x = xo*t+(1+xo*2)/16*t;
		const y = yo*t+(1+yo*2)/16*t;
		const args = [x, -y, x, -t-y, t+x, -y, x, -t-y, t+x, -t-y, t+x, -y];
		const m = t/512;
		uvs[0][0].set(args[0]+m, args[1]-m);
		uvs[0][1].set(args[2]+m, args[3]+m);
		uvs[0][2].set(args[4]-m, args[5]-m);
		uvs[1][0].set(args[6]+m, args[7]+m);
		uvs[1][1].set(args[8]-m, args[9]+m);
		uvs[1][2].set(args[10]-m, args[11]-m);
		(!this.cache) && (this.cache = []);
		(!this.cache[xo]) && (this.cache[xo] = [])
		this.cache[xo][yo] = geometry;
	}
	static loadImage(filename) {
		return new Promise((resolve, reject) => {
			var img = new Image();
			img.onload = resolve.bind(this, img);
			img.onerror = reject.bind(this, new Error("Could not load asset \""+filename+"\""));
			img.src = filename;
		});
	}
	static createTextureFromImage(asset) {
		if (asset instanceof HTMLCanvasElement) {
			asset = asset.toDataURL();
		}
		const loader = this.loader || new THREE.TextureLoader();
		return new Promise((resolve, reject) => {
			loader.load(
				asset,
				resolve,
				undefined,
				reject.bind(this, new Error("Could not load asset \""+asset+"\""))
			);
		});
	}
	static createEmptyCanvasFromImage(img, addCanvasToScreen = false) {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			canvas.width = img.width;
			canvas.height = img.height;
			//ctx.drawImage(img, 0, 0, img.width, img.height);
			if (addCanvasToScreen) {
				canvas.setAttribute("style", "display: block; position: absolute; z-index: 100; width: "+(img.width*3)+"px; image-rendering: optimizeSpeed; image-rendering: pixelated;");
				document.body.appendChild(canvas);
			}
			resolve(canvas);
		});
	}
	static async addMarginToCanvas(canvas, img) {
		const ctx = canvas.getContext("2d");
		let sx, sy, swidth, sheight, dx, dy, dwidth, dheight;

		var tilesHeight = canvas.height/16|0;
		var tilesWidth = canvas.height/16|0;

		for (let y = canvas.height-16; y >= 0; y -= 16) {
			for (let x = canvas.width-16; x >= 0; x -= 16) {
				let r = 0;
				dx = x+1+(x/16|0)*2;
				dy = y+1+(y/16|0)*2;
				if (x > 100 || y > 100) {
					continue;
				}
				ctx.drawImage(img, x, y, 16, 16, dx, dy, 16, 16);
				ctx.drawImage(canvas, dx, dy, 16, 1, dx-1, dy-1, 18, 1);
				ctx.drawImage(canvas, dx, dy, 1, 16, dx-1, dy-1, 1, 18);
				ctx.drawImage(canvas, dx, dy+15, 16, 1, dx-1, dy+15+1, 18, 1);
				ctx.drawImage(canvas, dx+15, dy, 1, 16, dx+15+1, dy-1, 1, 18);
			}
		}

		await new Promise(resolve=>setTimeout(resolve, 60));
	}
	// Loaded function, but whatever
	static async processImageAndGenerateTextureFromPath(sourcePath, addCanvasToScreen = false) {
		const image = await this.loadImage(sourcePath);
		const canvas = await this.createEmptyCanvasFromImage(image, addCanvasToScreen);
		await this.addMarginToCanvas(canvas, image);
		const texture = await this.createTextureFromImage(canvas);
		return texture;
	}

	static async getTexture() {
		if (!this.loaded) {
			this.load();
		}
		return this.texture;
	}

	static async load() {
		const textures = await Promise.all([
			this.processImageAndGenerateTextureFromPath(baseTexturePath)
		]);

		this.texture = textures[0];
		this.texture.wrapS = THREE.RepeatWrapping;
		this.texture.wrapT = THREE.RepeatWrapping;
		this.texture.magFilter = THREE.NearestFilter;
		this.texture.minFilter = THREE.LinearFilter;

		this.loaded = true;
	}
}