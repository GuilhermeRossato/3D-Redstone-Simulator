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
	}
	load(width, height) {
		const camera = this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.01, 255);
		this.camera.position.z = 1;
		const scene = this.scene = new THREE.Scene();

		const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
		const material = new THREE.MeshNormalMaterial();

		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		const rendererConfig = {
			canvas: this.canvas,
			antialias: true
		};

		const renderer = this.renderer = new THREE.WebGLRenderer(rendererConfig);
		renderer.setSize(this.width, this.height);
		document.body.appendChild(renderer.domElement);
	}
	draw() {
		this.renderer.render(this.scene, this.camera);
	}
}