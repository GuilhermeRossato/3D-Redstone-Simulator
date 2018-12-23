'use strict';

import * as THREE from './libs/three.module.js';
import SSAOPass from './third-party/SSAOPass.js';
import EffectComposer from './third-party/EffectComposer.js';

export default class GraphicsEngine {
	constructor(canvas, gl) {
		this.canvas = canvas;
		this.width = canvas.width;
		this.height = canvas.height;
	}
	resize(width, height) {
		this.width = width;
		this.height = height;
		if (this.camera) {
			this.camera.aspect = this.width / this.height;
			this.camera.updateProjectionMatrix();
		}
		if (this.renderer) {
			this.renderer.setSize(this.width, this.height);
		}
		if (this.ssaoPass) {
			this.ssaoPass.setSize(this.width, this.height);
		}
	}
	static addLightToScene(scene) {
		const addLight = (name, position, intensity) => {
			const light = new THREE.DirectionalLight(0xffffff, intensity);
			light.position.copy(position);
			light.matrixAutoUpdate = false;
			light.name = name;
			light.updateMatrix();
			scene.add(light);
		}
		addLight("Top", { x: 0, y: 1, z: 0 }, 2.935);
		addLight("Front", { x: 0, y: 0, z: -1 }, 2.382);
		addLight("Back", { x: 0, y: 0, z: 1 }, 2.3548);
		addLight("Left", { x: -1, y: 0, z: 0 }, 1.7764);
		addLight("Right", { x: 1, y: 0, z: 0 }, 1.7742);
		addLight("Bottom", { x: 0, y: -1, z: 0 }, 1.5161);
	}
	async load(width, height) {
		const camera = this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.01, 255);
		this.camera.position.z = 1;
		const scene = this.scene = new THREE.Scene();

		this.constructor.addLightToScene(scene);

		const geometry = new THREE.BoxGeometry(.5, .5, .5);
		const material = new THREE.MeshLambertMaterial({color:new THREE.Color("#333333")});

		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, 4.75, 0);
		scene.add(mesh);

		const rendererConfig = {
			canvas: this.canvas,
			antialias: true,
			alpha: false
		};
		const renderer = this.renderer = new THREE.WebGLRenderer(rendererConfig);
		renderer.setClearColor(0x333333, 1);
		renderer.setSize(this.width, this.height);
		if (!renderer.extensions.get( 'WEBGL_depth_texture')) {
			console.warn("Disabled SSAO because it doesn't seem supported");
			this.ssao = false;
		} else {
			this.ssao = true;
			const ssaoPass = this.ssaoPass = new SSAOPass(scene, camera, this.width, this.height);
			ssaoPass.kernelRadius = 7;
			ssaoPass.minDistance = 0.003;
			ssaoPass.maxDistance = 0.1;
			ssaoPass.renderToScreen = true;

			const effectComposer = this.effectComposer = new EffectComposer(renderer);
			effectComposer.addPass(ssaoPass);
		}
	}
	draw() {
		//this.renderer.render(this.scene, this.camera);
		this.effectComposer.render();
	}
}