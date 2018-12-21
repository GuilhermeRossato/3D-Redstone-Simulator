'use strict';

import GraphicsEngine from './GraphicsEngine.js';
import MainLoop from './MainLoop.js';
import WorldHandler from './classes/world/WorldHandler.js';
import Performancer from './Performancer.js';

export default class App {
	constructor(canvas, gl, assets) {
		this.canvas = canvas;
		this.gl = gl;
		this.assets = assets;
		this.resize = this.resize.bind(this);
		this.update = this.update.bind(this);
		this.draw = this.draw.bind(this);
		this.overflow = this.overflow.bind(this);
		this.mousemove = this.mousemove.bind(this);
		this.world = undefined;
		this.graphics = undefined;
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
		window.addEventListener("resize", this.debounce(this.resize, 200));
		window.addEventListener("mousemove", this.debounce(this.mousemove, 100));
	}
	update() {
		// Update camera around the object
		if (this.frame < 5000) {
			this.frame++;
		} else {
			this.frame = 0;
		}
		if (this.frame%20 === 19) {
			const element = document.querySelector(".footer");
			if (!element.classList.contains("closed")) {
				element.querySelector(".footer-text").innerText = "Hello World";
			}
		}
		if (this.graphics.camera) {
			var angle = 2*Math.PI*(this.frame/5000);
			//angle = Math.PI*0.25;
			var scale = window.scale || 1;
			this.graphics.camera.position.x = Math.cos(angle)*30*scale;
			this.graphics.camera.position.z = Math.sin(angle)*30*scale;
			this.graphics.camera.position.y = 15*scale;
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
		window.graphics = this.graphics;
		document.querySelector(".wrapper").appendChild(this.canvas);
		this.canvas.style.position = "absolute";
		await this.graphics.load();
		this.resize();
		this.attachEvents();
		this.performancer = new Performancer(true, 10);
		this.performancer.attach(document.body);
	}
	async loadWorld() {
		this.world = new WorldHandler(this.graphics);
		await this.world.load();
		for (var i = 0; i < 25; i++) {
			for (var j = 0; j < 25; j++) {
				this.world.set(i-12, (i%3==0||j%3==0)?0:2, j-12, (i%3==0||j%3==0)?2:1);
			}
		}
	}
	async loadLoop() {
		this.loop = new MainLoop({
			fps: 60,
			draw: this.draw,
			update: this.update,
			overflow: this.overflow,
			performancer: this.performancer
		});
		this.loop.start();
	}
	mousemove(evt) {
		const nx = (evt.clientX/window.innerWidth);
		const ny = (evt.clientY/window.innerHeight);
		const element = document.querySelector(".footer");
		if (nx > 0.75 && ny > 0.8 && element.classList.contains("closed")) {
			element.classList.remove("closed");
		} else if ((nx <= 0.75 || ny <= 0.8) && !element.classList.contains("closed")) {
			element.classList.add("closed");
		}
	}
	resize() {
		this.width = this.canvas.width = window.innerWidth - 8;
		this.height = this.canvas.height = window.innerHeight - 7;
		this.graphics && this.graphics.resize(this.width, this.height);
	}
}