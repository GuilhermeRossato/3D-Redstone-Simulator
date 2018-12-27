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
			this.material.side = THREE.FrontSide;
		}
		return this.material;
	}
	getCachedResult(x, y, defaultValue=false) {
		if (!this.cache[x] || !this.cache[x][y]) {
			return defaultValue;
		}
		return this.cache[x][y];
	}
	applyUv(geometry, xo, yo) {
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
		(!this.cache[xo]) && (this.cache[xo] = [])
		this.cache[xo][yo] = geometry;
	}
	loadImage(filename) {
		return new Promise((resolve, reject) => {
			var img = new Image();
			img.onload = resolve.bind(this, img);
			img.onerror = reject.bind(this, new Error("Could not load asset \""+filename+"\""));
			img.src = filename;
		});
	}
	loadImageWithThreejs(asset) {
		return new Promise((resolve, reject) => {
			this.loader = this.loader || new THREE.TextureLoader();
			this.texture = this.loader.load(
				asset,
				resolve,
				undefined,
				reject.bind(this, new Error("Could not load asset \""+asset+"\""))
			);
		});
	}
	createCanvasFromImage(img) {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0, img.width, img.height);
			resolve(canvas);
		});
	}
	addMarginToCanvas(canvas, img) {
		const ctx = canvas.getContext("2d");
		let sx, sy, swidth, sheight, dx, dy, dwidth, dheight;
		for (let i=0;i<canvas.height;i+=18) {
			sx = 0;
			sy = i+1;
			dwidth = swidth = canvas.width;
			dheight = sheight = 1;
			dx = 0;
			dy = i;
			ctx.drawImage(canvas, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);
			sy = i+16;
			dy = i+17;
			ctx.drawImage(canvas, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);
			sx = i+1;
			sy = 0;
			dwidth = swidth = 1;
			dheight = sheight = canvas.height;
			dx = i;
			dy = 0;
			ctx.drawImage(canvas, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);
			sx = i+16;
			dx = i+17;
			ctx.drawImage(canvas, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);
		}
	}
	async load() {
		const img = await this.loadImage("../assets/textures_separated.png");
		const canvas = await this.createCanvasFromImage(img);
		this.addMarginToCanvas(canvas, img);
		await new Promise(resolve=>setTimeout(resolve, 50));
		return await this.loadImageWithThreejs(canvas.toDataURL());
	}
}