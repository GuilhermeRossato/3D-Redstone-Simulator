'use strict';

import * as THREE from './libs/three.module.js';

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
	}
	static addLightToScene(scene) {
		const addLight = (name, position, intensity) => {
			const light = new THREE.DirectionalLight(0xffffff, intensity);
			light.position.copy(position);
			light.name = name;
			scene.add(light);
		}
		addLight("Top", { x: 0, y: 1, z: 0 }, 2.935);
		addLight("Front", { x: 0, y: 0, z: -1 }, 2.382);
		addLight("Back", { x: 0, y: 0, z: 1 }, 2.3548);
		addLight("Left", { x: -1, y: 0, z: 0 }, 1.7764);
		addLight("Right", { x: 1, y: 0, z: 0 }, 1.7742);
		addLight("Bottom", { x: 0, y: -1, z: 0 }, 1.5161);
	}
	load(width, height) {
		const camera = this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.01, 255);
		this.camera.position.z = 1;
		const scene = this.scene = new THREE.Scene();

		this.constructor.addLightToScene(scene);

		const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
		const material = new THREE.MeshNormalMaterial();

		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		const rendererConfig = {
			canvas: this.canvas,
			antialias: true,
			alpha: false
		};
		const renderer = this.renderer = new THREE.WebGLRenderer(rendererConfig);
		renderer.setClearColor(0x333333, 1);
		renderer.setSize(this.width, this.height);
	}
	draw() {
		this.renderer.render(this.scene, this.camera);
	}
}