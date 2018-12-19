'use strict';

import GraphicsEngine from './GraphicsEngine.js';
import MainLoop from './MainLoop.js';
import WorldHandler from './classes/world/WorldHandler.js';

export default class App {
	constructor(canvas, gl, assets) {
		this.canvas = canvas;
		this.gl = gl;
		this.assets = assets;
		this.resize = this.resize.bind(this);
		this.update = this.update.bind(this);
		this.draw = this.draw.bind(this);
		this.overflow = this.overflow.bind(this);
	}
	debounce(func, delay) {
		let inDebounce
		return function(...args) {
			const context = this;
			(inDebounce !== undefined) && clearTimeout(inDebounce);
			inDebounce = setTimeout(() => func.apply(context, args), delay);
		}
	}
	attachEvents() {
		window.addEventListener("resize", this.debounce(this.resize, 300));
	}
	update() {
		// Update camera around the object
		if (this.frame < 500) {
			this.frame++;
		} else {
			this.frame = 0;
		}
		if (this.graphics.camera) {
			var angle = 2*Math.PI*(this.frame/500);
			this.graphics.camera.position.x = Math.cos(angle)*2;
			this.graphics.camera.position.z = Math.sin(angle)*2;
			this.graphics.camera.lookAt(0, 0, 0);
		}
	}
	draw() {
		this.graphics.draw();
	}
	overflow() {
		// Called when 333ms has been elapsed since last update
		console.log("overflow");
	}
	async loadGraphics() {
		this.graphics = new GraphicsEngine(this.canvas, this.gl);
		document.querySelector(".wrapper").appendChild(this.canvas);
		this.canvas.style.position = "absolute";
		await this.graphics.load();
		this.resize();
		this.attachEvents();
	}
	async loadWorld() {
		this.world = new WorldHandler(this.graphics);
		await this.world.load();
	}
	async loadLoop() {
		this.loop = new MainLoop({
			fps: 60,
			draw: this.draw,
			update: this.update,
			overflow: this.overflow
		});
		this.loop.start();
	}
	resize() {
		this.width = this.canvas.width = window.innerWidth - 10;
		this.height = this.canvas.height = window.innerHeight - 9;
		this.graphics && this.graphics.resize(this.width, this.height);
	}
}