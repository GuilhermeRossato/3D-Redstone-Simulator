'use strict';

import AppLoader from './AppLoader.js';
import Configuration from "./data/Configuration.js";
import LocalStorageService from "./services/LocalStorageService.js";
import ScreenService from "./screens/ScreenService.js";
import ControlSelectorScreen from "./screens/ControlSelectorScreen.js";

import * as THREE from './libs/three.module.js';
import TextureService from './graphics/TextureService.js';

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
		window.addEventListener("mousemove", this.debounce(this.mousemove.bind(this), 100));
		window.addEventListener("mousedown", this.debounce(this.mousedown.bind(this), 100));
	}
	update() {
		(this.screen) && (this.screen.update) && (this.screen.update());
		// Update camera around the object
		if (this.frame < 9000) {
			this.frame++;
		} else {
			this.frame = 0;
		}
		if (this.frame%20 === 19) {
			const element = document.querySelector(".footer");
			if (!element.classList.contains("closed")) {
				element.querySelector(".footer-text").innerHTML = "Render Calls:"+this.graphics.renderer.info.render.calls+"<br>Blocks: "+this.world.blockList.length+"<br>Faces:"+(this.world.blockList.length*6);
			}
		}
		if (this.graphics.camera) {
			var angle = 2*Math.PI*(this.frame/9000)
			//angle = Math.PI*1.7;
			var scale = window.scale || 0.25;
			this.graphics.camera.position.x = 0.41+Math.cos(angle)*10*scale;
			this.graphics.camera.position.z = Math.sin(angle)*10*scale;
			this.graphics.camera.position.y = 0+68*scale;
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
		return await this.loader.loadGraphics();
	}
	mockWorld() {
		const size = 8;
		this.world.set(0, 3, 0, 1);
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				this.world.set(i-size/2, (i%3==0||j%3==0)?0:2+j%3-i%3, j-size/2, (i%3==0||j%3==0)?2:3);
			}
		}
		this.addTests();
	}
	async addTests() {
		const scene = this.world.scene;
		const material = TextureService.getMaterial();
		window.scene = scene;
		window.material = material;
		window.THREE = THREE;
		
		var geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
		
		var material2 = new THREE.MeshLambertMaterial({
			map: TextureService.texture,
			color: 0x555555,
			wireframe: false,
			transparent: true,
			alphaMap: TextureService.alphaMap
		});
		material2.side = THREE.FrontSide;

		var count = 100;

		var mesh = new THREE.InstancedMesh( geometry, material2, count );

		var dummy = new THREE.Object3D();

		for ( var i = 0; i < count; i ++ ) {

			dummy.position.set(
				Math.random() * 20 - 10,
				Math.random() * 20 - 10,
				Math.random() * 20 - 10
			);

			dummy.rotation.set(
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI
			);

			dummy.updateMatrix();

			mesh.setMatrixAt( i, dummy.matrix );

		}

		mesh.position.set(0, 4, 0);
		scene.add( mesh );
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