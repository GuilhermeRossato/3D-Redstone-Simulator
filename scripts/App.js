'use strict';

import AppLoader from './AppLoader.js';
import Configuration from "./data/Configuration.js";
import LocalStorageService from "./services/LocalStorageService.js";
import ScreenService from "./screens/ScreenService.js";
import ControlSelectorScreen from "./screens/ControlSelectorScreen.js";

import * as THREE from './libs/three.module.js';
import TextureService from './graphics/TextureService.js';
import Chunk from './classes/world/Chunk.js';

export default class App {
	constructor(canvas, gl, assets, loader) {
		this.canvas = canvas;
		this.gl = gl;
		this.assets = assets;

		this.loader = loader ? loader : (new AppLoader(this));

		this.world = undefined;
		this.graphics = undefined;

		this.update = this.update.bind(this);
		this.draw = this.draw.bind(this);
		this.overflow = this.overflow.bind(this);

		window.cameraId = parseInt(window.localStorage.getItem("camera-id") || "1");
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
		window.addEventListener("resize", this.debounce(this.resize.bind(this), 200));
		//window.addEventListener("mousemove", this.debounce(this.mousemove.bind(this), 1));
		window.addEventListener("mousemove", this.mousemove.bind(this));
		window.addEventListener("mousedown", this.debounce(this.mousedown.bind(this), 100));
		window.addEventListener("keydown", this.keydown.bind(this));
	}
	updateCamera(id, frame) {
		if (this.lastCameraId === id && id >= 2 && id <= 4) {
			return;
		}

		if (id === 1 || id === 2) {
			var angle = 2*Math.PI*(id === 1 ? this.frame/1000 : this.frame/333)
			var scale = window.scale || 0.5;
			this.graphics.camera.position.x = Math.cos(angle)*10*scale;
			this.graphics.camera.position.z = Math.sin(angle)*10*scale;
			this.graphics.camera.position.y = 6;
			this.graphics.camera.lookAt(0, 0, 0);
		} else if (id === 3 || id === 4 || id === 5) {
			var angle;
			if (id === 3) {
				angle = 2*Math.PI*0.1;
			} else if (id === 4) {
				angle = 2*Math.PI*0.2;
			} else if (id === 5) {
				angle = 2*Math.PI*0.52;
			}
			var scale = window.scale || 0.35;
			this.graphics.camera.position.x = 0+Math.cos(angle)*10*scale;
			this.graphics.camera.position.z = 0+Math.sin(angle)*10*scale;
			this.graphics.camera.position.y = 2;
			if (id === 5) {
				this.graphics.camera.position.y = 4;
			}
			this.graphics.camera.lookAt(0, 0, 0);
		} else if (id === 6) {
			this.graphics.camera.position.set(0, 7, 0);
			this.graphics.camera.lookAt(0, 0, 0);
		}
		document.title = id;
	}
	update() {
		(this.screen) && (this.screen.update) && (this.screen.update());
		// Update camera around the object
		if (this.frame%20 === 19) {
			const element = document.querySelector(".footer");
			if (!element.classList.contains("closed")) {
				element.querySelector(".footer-text").innerHTML = "Render Calls:"+this.graphics.renderer.info.render.calls+"<br>Blocks: "+this.world.blockList.length+"<br>Faces:"+(this.world.blockList.length*6);
			}
		}
		if (this.frame < 1000) {
			this.frame++;
		} else {
			this.frame = 0;
		}
		
		if (this.graphics.camera) {
			const cameraId = window.cameraId || 1;
			this.updateCamera(cameraId, this.frame);
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
		return await this.loader.loadGraphics();
	}
	mockWorld() {
		const size = 8;
		//this.world.set(0, 1, 1, 1);
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				//this.world.set(i-size/2, (i%3==0||j%3==0)?0:2+j%3-i%3, j-size/2, (i%3==0||j%3==0)?2:3);
			}
		}
		this.addTests();
	}
	keydown(event) {
		if (event.code === "Digit1") {
			window.cameraId = 1;
			this.frame = 0;
			window.localStorage.setItem("camera-id", window.cameraId);
		} else if (event.code === "Digit2") {
			window.cameraId = 2;
			this.frame = 0.5;
			window.localStorage.setItem("camera-id", window.cameraId);
		} else if (event.code === "Digit3") {
			window.cameraId = 3;
			window.localStorage.setItem("camera-id", window.cameraId);
		} else if (event.code === "Digit4") {
			window.cameraId = 4;
			window.localStorage.setItem("camera-id", window.cameraId);
		} else if (event.code === "Digit5") {
			window.cameraId = 5;
			window.localStorage.setItem("camera-id", window.cameraId);
		} else if (event.code === "Digit6") {
			window.cameraId = 6;
			window.localStorage.setItem("camera-id", window.cameraId);
		} else if (event.code === "Digit7") {
			window.cameraId = 7;
			window.localStorage.setItem("camera-id", window.cameraId);
		}
	}
	async addTests() {
		const scene = this.world.scene;
		window.scene = scene;
		window.THREE = THREE;

		const chunk = new Chunk(0, 0, 0);
		const size = 0;
		for (var i = -size/2|0; i <= size/2|0; i++) {
			for (var j = -size/2|0; j < size/2|0; j++) {
				chunk.set(i, 1, j, 1);
			}
		}

		var seed = 11;
		function random() {
			var x = Math.sin(seed++) * 10000;
			return x - Math.floor(x);
		}

		var map = [
			random(), random(), random(), random(), random(),
			random(), random(), random(), random(), random(),
			random(), random(), random(), random(), random(),
			random()+0.5, random(), random(), random(), random(),
			random(), random(), random(), random(), random(),
		];

		for (var i = 0; i < 25; i++) {
			for (var j = 0; j < 25; j++) {
				chunk.set(i-12, random() * 2 | 0, j-12, (random() * 2 | 0) ? 2 : 1);
			}
		}

		chunk.assignTo(scene);
		/*
		const value = map[1] + map[5] * 2 + map[7] * 4 + map[3] * 8 + map[2] * 16 + map[8] * 32 + map[6] * 64 + map[0] * 128;
	
		setTimeout(()=>{
			const root = document.querySelector(".root");
			root && (root.innerText = value.toString());
		}, 650);
		*/
	}
	async loadWorld() {
		await this.loader.loadWorld();
		this.mockWorld();
	}
	async loadScreens() {
		await this.loader.loadScreens();
	}
	onInputTypeSelected(selection) {
		ScreenService.setScreen(this, undefined);
		LocalStorageService.save("inputType", selection);
		this.setupInputType(selection);
	}
	setupInputType(name) {
		Configuration.inputType.value = name;
	}
	async loadLoop() {
		this.loader.loadLoop(this.draw, this.update, this.overflow, this.performancer);
	}
	loadInputType() {
		const inputType = LocalStorageService.load("inputType");
		if (!inputType || inputType === "unknown") {
			return "unknown"
		} else {
			return inputType;
		}
	}
	start() {
		ScreenService.clearScreen();

		const inputType = this.loadInputType();
		
		if (inputType === "unknown") {
			ScreenService.setScreen(this, ControlSelectorScreen);
			ControlSelectorScreen.once("select", this.onInputTypeSelected.bind(this));
		} else {
			this.setupInputType(inputType);
		}
	}
	mousemove(evt) {
		const nx = (evt.clientX/window.innerWidth);
		const ny = (evt.clientY/window.innerHeight);
		window.lastMouseX = nx;
		window.lastMouseY = ny;
		const element = document.querySelector(".footer");
		if (nx > 0.75 && ny > 0.8 && element.classList.contains("closed")) {
			element.classList.remove("closed");
		} else if ((nx <= 0.75 || ny <= 0.8) && !element.classList.contains("closed")) {
			element.classList.add("closed");
		}
	}
	mousedown(evt) {
		if (evt.button !== 0) return;
		console.log("Mouse Down");
	}
	resize() {
		this.width = this.canvas.width = window.innerWidth;
		this.height = this.canvas.height = window.innerHeight;
		this.graphics && this.graphics.resize(this.width, this.height);
		this.screen && this.screen.resize && this.screen.resize(this.width, this.height);
	}
}