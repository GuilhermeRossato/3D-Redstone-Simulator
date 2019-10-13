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
			var angle = 2*Math.PI*(id === 1 ? this.frame/250 : this.frame/1000)
			var scale = window.scale || 0.35;
			this.graphics.camera.position.x = 0.41+Math.cos(angle)*10*scale;
			this.graphics.camera.position.z = 0.41+Math.sin(angle)*10*scale;
			this.graphics.camera.position.y = 2;
			this.graphics.camera.lookAt(0, 0, 0);
		} else if (id === 3 || id === 4 || id === 5) {
			var angle
			if (id === 3) {
				angle = 2*Math.PI*0.1;
			} else if (id === 4) {
				angle = 2*Math.PI*0.2;
			} else if (id === 5) {
				angle = 2*Math.PI*0.3;
			}
			var scale = window.scale || 0.35;
			this.graphics.camera.position.x = 0.41+Math.cos(angle)*10*scale;
			this.graphics.camera.position.z = 0.41+Math.sin(angle)*10*scale;
			this.graphics.camera.position.y = 2;
			this.graphics.camera.lookAt(0, 0, 0);
		}
		document.title = id;
	}
	update() {
		(this.screen) && (this.screen.update) && (this.screen.update());
		// Update camera around the object
		if (this.frame < 1000) {
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
		//this.world.set(0, 1, 0, 1);
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
		}
	}
	async addTests() {
		const scene = this.world.scene;
		//const material = TextureService.getMaterial();
		window.scene = scene;
		//window.material = material;
		window.THREE = THREE;
		

		var geometry = new THREE.PlaneBufferGeometry(2, 2);

		const instanced = new THREE.InstancedBufferGeometry();
		instanced.attributes.position = geometry.attributes.position;
		instanced.attributes.uv = geometry.attributes.uv;
		instanced.index = geometry.index;

		const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array([-1.1, 1.1, 0, 1.1, 1.1, 0, -1.1, -1.1, 0, 1.1, -1.1, 0]), 3);
		instanced.addAttribute("instancePosition", positionAttribute);
		const uvAttribute = new THREE.InstancedBufferAttribute( new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2);
		instanced.addAttribute("instanceUv", uvAttribute);

		const material2 = new THREE.ShaderMaterial({
			uniforms: {
				texture1: { value: TextureService.texture },
				textureDivision: { value: new THREE.Vector2(8,8) },
				time: {value: 0}
			},
			vertexShader: `
				precision highp float;

				uniform vec2 textureDivision;
				uniform float time;

				attribute vec3 instancePosition;
				attribute vec2 instanceUv;

				varying vec2 vUv;

				void main(){
				vec2 slices = vec2(1.0) / textureDivision;
					vUv = slices * instanceUv + slices * uv;
				vec3 pos = position + instancePosition;
				pos += normalize(instancePosition) * (sin(time) * 0.5 + 0.5);

					gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
				}
			`,
			fragmentShader: `
				precision highp float;

				uniform sampler2D texture1;

				varying vec2 vUv;

				void main() {
					gl_FragColor = texture2D(texture1, vUv);
				}
			`
		});

		const mesh = new THREE.Mesh(instanced, material2);
		mesh.position.set(0, 0, 0);
		scene.add(mesh);
		scene.add(new THREE.AxesHelper(0.2));
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