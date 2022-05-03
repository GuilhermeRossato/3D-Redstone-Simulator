'use strict';

import BlockData from '../data/BlockData.js';
import * as THREE from '../../scripts/third-party/three.module.js';

export default class TextureService {

	static async load() {
		if (this.loaded) {
			console.warn("Attempted to reload texture service");
			return;
		}

		let textureFilenameList = [];

		for (let block of BlockData) {
			if (!block.texture) {
				continue;
			}
			if (!block.name) {
				throw new Error("Block data contains a block without a name");
			}
			if (typeof block.texture === "string") {
				textureFilenameList.push(block.texture);
			} else if (block.texture instanceof Array) {
				for (let texture of block.texture) {
					if (typeof texture === "string") {
						textureFilenameList.push(texture);
						// @ts-ignore
					} else if (texture instanceof Array) {
						// @ts-ignore
						for (let subTexture of texture) {
							if (typeof subTexture === "string") {
								textureFilenameList.push(subTexture);
							} else {
								throw new Error(`Could not interpret sub texture of block "${block.name}"`);
							}
						}
					} else {
						throw new Error(`Could not interpret sub texture of block "${block.name}"`);
					}
				}
			} else {
				throw new Error(`Could not interpret sub texture of block "${block.name}"`);
			}
		}

		this.textureLookup = {};
		let tx = 0;
		let ty = 0;
		for (let filename of textureFilenameList) {
			if (this.textureLookup[filename]) {
				// Already loaded
				continue;
			}
			this.textureLookup[filename] = {
				tx,
				ty,
				path: "assets/textures/" + filename,
				image: await TextureService.loadImage("assets/textures/" + filename)
			}
			tx++;
			if (tx >= 7) {
				tx = 0;
				ty++;
				if (ty >= 8) {
					throw new Error("Texture buffer overflow");
				}
			}
		}

		{
			const gridCanvas = await this.generateCanvasFromLookup(this.textureLookup);
			const newCanvas = document.createElement("canvas");
			newCanvas.width = gridCanvas.width;
			newCanvas.height = gridCanvas.height;
			await this.addMarginToCanvas(newCanvas, gridCanvas);

			const texture = await this.createTextureFromCanvas(newCanvas);

			this.texture = texture;
			this.texture.wrapS = THREE.RepeatWrapping;
			this.texture.wrapT = THREE.RepeatWrapping;
			this.texture.magFilter = THREE.NearestFilter;
			this.texture.minFilter = THREE.LinearFilter;
		}

		this.aoTexture = await this.processImageAndGenerateTextureFromPath("assets/ambient-occlusion.png", false);
		this.aoTexture.wrapS = THREE.RepeatWrapping;
		this.aoTexture.wrapT = THREE.RepeatWrapping;
		this.aoTexture.magFilter = THREE.NearestFilter;
		this.aoTexture.minFilter = THREE.LinearFilter;

		this.loaded = true;
	}

	/**
	 * Returns the position of a given texture filename, or the position of a random one if a array is given
	 * @param {string | string[] | string[][]} filename
	 * @param {number} [randomUid] A number that correspond to a seed value to choose the random texture if it is an array
	 * @returns {{tx: number, ty: number}}
	 */
	static getTexturePosition(filename, randomUid) {
		if (filename instanceof Array) {
			filename = filename[0];
		}
		if (filename instanceof Array) {
			filename = filename[0];
		}
		const t = this.textureLookup[filename]
		if (!t) {
			return {tx: 0, ty: 0};
		}
		return t;
	}

	/**
	 *
	 * @param {Record<string, {tx: number, ty: number, image: HTMLImageElement}>} textureLookup
	 */
	static async generateCanvasFromLookup(textureLookup) {
		const canvas = document.createElement("canvas");
		canvas.width = 16 * 8;
		canvas.height = 16 * 8;
		const ctx = canvas.getContext("2d");
		for (let filename in textureLookup) {
			const imageData = textureLookup[filename];
			ctx.drawImage(imageData.image, 0, 0, 16, 16, imageData.tx * 16, imageData.ty * 16, 16, 16);
		}
		return canvas;
	}

	static getMaterial() {
		if (!this.material) {
			this.material = new THREE.MeshLambertMaterial({
				map: this.texture,
				color: 0x555555,
				side: THREE.FrontSide
			});
			// Fixes an old bug
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

	/**
	 * @param {THREE.Geometry} geometry
	 * @param {number} xo
	 * @param {number} yo
	 */
	static applyUv(geometry, xo, yo) {
		const uvs = geometry.faceVertexUvs[0];
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

	/**
	 * @param {string} filename
	 * @returns {Promise<HTMLImageElement>}
	 */
	static loadImage(filename) {
		return new Promise((resolve, reject) => {
			var img = new Image();
			img.onload = resolve.bind(this, img);
			img.onerror = reject.bind(this, new Error("Could not load asset \""+filename+"\""));
			img.src = filename;
		});
	}



	static createCanvas(width, height, addCanvasToScreen = false) {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			if (addCanvasToScreen) {
				canvas.setAttribute("style", "display: block; position: absolute; z-index: 100; width: "+(width*3)+"px; image-rendering: optimizeSpeed; image-rendering: pixelated;");
				document.body.appendChild(canvas);
			}
			resolve(canvas);
		});
	}

	/**
	 * @param {HTMLCanvasElement} target
	 * @param {HTMLCanvasElement | HTMLImageElement} origin
	 */
	static async addMarginToCanvas(target, origin) {
		const ctx = target.getContext("2d");
		let sx, sy, swidth, sheight, dx, dy, dwidth, dheight;

		var tilesHeight = target.height/16|0;
		var tilesWidth = target.height/16|0;

		for (let y = target.height-16; y >= 0; y -= 16) {
			for (let x = target.width-16; x >= 0; x -= 16) {
				let r = 0;
				dx = x+1+(x/16|0)*2;
				dy = y+1+(y/16|0)*2;
				if (x >= target.width || y >= target.height) {
					continue;
				}
				ctx.drawImage(origin, x, y, 16, 16, dx, dy, 16, 16);
				ctx.drawImage(target, dx, dy, 16, 1, dx-1, dy-1, 18, 1);
				ctx.drawImage(target, dx, dy, 1, 16, dx-1, dy-1, 1, 18);
				ctx.drawImage(target, dx, dy+15, 16, 1, dx-1, dy+15+1, 18, 1);
				ctx.drawImage(target, dx+15, dy, 1, 16, dx+15+1, dy-1, 1, 18);
			}
		}

		await new Promise(resolve=>setTimeout(resolve, 60));
	}

	static async processImageAndGenerateTextureFromPath(sourcePath, addCanvasToScreen = false) {
		const image = await this.loadImage(sourcePath);
		const canvas = await this.createCanvas(image.width, image.height, addCanvasToScreen);
		await this.addMarginToCanvas(canvas, image);
		return await this.createTextureFromCanvas(canvas);
	}

	static getTexture() {
		if (!this.loaded) {
			throw new Error("Texture Service has not been loaded yet");
		}
		return this.texture;
	}
}