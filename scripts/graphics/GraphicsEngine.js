'use strict';

import * as THREE from '../../node_modules/three/src/Three.js';
import TextureService from './TextureService.js';
import ResourceLoader from '../classes/ResourceLoader.js';

export default class GraphicsEngine {
	constructor(wrapper, canvas, gl) {
		if (canvas.parentNode != wrapper) {
			wrapper.appendChild(canvas);
		}
		this.canvas = canvas;
		this.width = canvas.width;
		this.height = canvas.height;
		this.canSend = true;
		this.aaScale = 1;

		/** @type {boolean | undefined} */
		this.fixedSize;
		/** @type {string | undefined} */
		this.vertexShader;
		/** @type {string | undefined} */
		this.fragmentShader;
	}

	resize(width, height) {
		const aaScale = this.aaScale;
		if (this.fixedSize) {
			this.width = 856*aaScale;
			this.height = 384*aaScale;
		} else {
			this.width = width*aaScale;
			this.height = height*aaScale;
		}
		if (this.camera) {
			this.camera.aspect = this.width / this.height;
			this.camera.updateProjectionMatrix();
		}
		if (this.renderer) {
			this.renderer.setSize(this.width, this.height);
			this.renderer.domElement.style.width = this.width/aaScale+"px";
			this.renderer.domElement.style.height = this.height/aaScale+"px";
			this.renderer.domElement.width = this.width;
			this.renderer.domElement.height = this.height;
		}
	}

	async load() {
		const camera = this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.01, 255);
		this.camera.position.z = 1;
		const scene = this.scene = new THREE.Scene();
		scene.add(camera);

		window["scene"] = scene;
		window["THREE"] = THREE;

		let context = this.canvas.getContext('webgl2');
		if (!context) {
			context = this.canvas.getContext('webgl');
		}
		if (!context) {
			throw new Error("WebGL not supported");
		}
		const rendererConfig = {
			canvas: this.canvas,
			antialias: false,
			antialiasing: false,
			alpha: false,
			context: context
		};
		const renderer = this.renderer = new THREE.WebGLRenderer(rendererConfig);
		renderer.setClearColor(0x333333, 1);
		renderer.setSize(this.width, this.height);

		const gl = context;
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		this.vertexShader = await ResourceLoader.load("assets/vertex-shader.glsl");
		this.fragmentShader = await ResourceLoader.load("assets/fragment-shader.glsl");

		this.loaded = true;
	}

	getMaterial() {
		if (!this.material) {
			this.material = this.generateMaterial();
		}
		return this.material;
	}

	generateMaterial() {
		if (!TextureService.loaded) {
			return console.warn("TextureService has not loaded yet");
		}

		const material = new THREE.ShaderMaterial({
			uniforms: {
				texture0: { value: TextureService.texture },
				texture1: { value: TextureService.aoTexture },
				time: {value: 0}
			},
			vertexShader: this.vertexShader,
			fragmentShader: this.fragmentShader,
			transparent: true
		});

		material.side = THREE.FrontSide;
		return material;
	}

	draw() {
		this.renderer.render(this.scene, this.camera);
	}

	/**
	 * A helper function to send a POST with a PNG image of the canvas to a server, to create a visualization or something
	 * @param {number} photoNum
	 */
	sendCanvasToSaveServer(photoNum = 0) {
		if (!this.canSend) {
			return;
		}
		this.canSend = false;

		if (this.image_downloads < 20000) {
			this.image_downloads++;
		} else {
			this.image_downloads = 0;
		}
		if (this.image_downloads > 5000) {
			return false;
		}
		const self = this;
		const data = new FormData();
		const countStr = photoNum ? photoNum.toString().padStart(3, '0') : (this.image_downloads<10)?"00"+this.image_downloads:((this.image_downloads<100)?"0"+this.image_downloads:this.image_downloads);
		data.append("content", this.renderer.domElement.toDataURL());
		data.append("filename", 'img'+countStr+'.png');
		return new Promise(resolve => {
			fetch("http://localhost:8081", {
				method: "post",
				body: data
			}).then(r=>r.text()).then((txt) => {
				self.canSend = true;
				resolve();
			}).catch(resolve);
		});
	}
}