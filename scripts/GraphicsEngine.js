'use strict';

import * as THREE from './libs/three.module.js';
import SSAOPass from './third-party/SSAOPass.js';
import EffectComposer from './third-party/EffectComposer.js';

export default class GraphicsEngine {
	constructor(canvas, gl) {
		this.canvas = canvas;
		this.width = canvas.width;
		this.height = canvas.height;
		this.width = 856;
		this.height = 384;
		this.continue = true;
		this.aaScale = 1;
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
		if (this.ssaoPass) {
			this.ssaoPass.setSize(this.width, this.height);
			this.renderer.domElement.style.width = this.width/aaScale+"px";
			this.renderer.domElement.style.height = this.height/aaScale+"px";
			this.renderer.domElement.width = this.width;
			this.renderer.domElement.height = this.height;
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
	async addSSAO(scene, camera, renderer) {
		const ssaoPass = this.ssaoPass = new SSAOPass(scene, camera, this.width, this.height);
		ssaoPass.kernelRadius = 15;
		ssaoPass.minDistance = 0.006;
		ssaoPass.maxDistance = 0.2;
		ssaoPass.renderToScreen = true;

		const effectComposer = this.effectComposer = new EffectComposer(renderer);
		effectComposer.addPass(ssaoPass);
	}
	async load(width, height) {
		const camera = this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.01, 255);
		this.camera.position.z = 1;
		const scene = this.scene = new THREE.Scene();

		this.constructor.addLightToScene(scene);

		/*
		const geometry = new THREE.BoxGeometry(.5, .5, .5);
		const material = new THREE.MeshLambertMaterial({color:new THREE.Color("#333333")});

		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, 4.75, 0);
		scene.add(mesh);
		*/

		var context = this.canvas.getContext('webgl2');
		if (!context) {
			context = this.canvas.getContext('webgl');
		}
		const gl = context;
		const rendererConfig = {
			canvas: this.canvas,
			antialias: true,
			antialiasing: true,
			alpha: false,
			context: context
		};
		const renderer = this.renderer = new THREE.WebGLRenderer(rendererConfig);
		renderer.setClearColor(0x333333, 1);
		renderer.setSize(this.width, this.height);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		//renderer.setFaceCulling(false);

		if (!renderer.extensions.get( 'WEBGL_depth_texture')) {
			console.warn("Disabled SSAO because it doesn't seem supported");
			this.ssao = false;
		} else {
			this.ssao = true;
			this.addSSAO(scene, camera, renderer);
		}
	}

	draw() {
		if (this.frame < 20000) {
			this.frame++;
		} else {
			this.frame = 0;
		}
		this.ssao = false;
		if (this.effectComposer && this.ssao) {
			this.effectComposer.render();	
		} else {
			this.renderer.render(this.scene, this.camera);
		}
	}
	sendCanvasToSaveServer() {
		if (!this.continue) {
			return;
		}
		this.continue = false;

		if (this.image_downloads < 20000) {
			this.image_downloads++;
		} else {
			this.image_downloads = 0;
		}
		if (this.image_downloads > 250) {
			return false;
		}
		const self = this;
		const data = new FormData();
		const countStr = (this.image_downloads<10)?"00"+this.image_downloads:((this.image_downloads<100)?"0"+this.image_downloads:this.image_downloads);
		const ssaoStr = this.ssao?"ssao":"no-ssao";
		data.append("content", this.renderer.domElement.toDataURL());
		data.append("filename", 'img'+countStr+'-'+ssaoStr+'.png');
		fetch("http://localhost:8081", {
			method: "post",
			body: data
		}).then(r=>r.text()).then((txt) => {
			/*txt = txt.substr(txt.indexOf("<pre>")+5);
			txt = txt.substr(0, txt.length-6);
			const json = JSON.parse(txt);
			console.log(json);*/
			self.continue = true;
		});
	}
}