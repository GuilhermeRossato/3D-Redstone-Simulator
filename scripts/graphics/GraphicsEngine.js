'use strict';

import * as THREE from '../libs/three.module.js';
import TextureService from './TextureService.js';

export default class GraphicsEngine {
	constructor(wrapper, canvas, gl) {
		if (canvas.parentNode != wrapper) {
			wrapper.appendChild(canvas);
		}
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

		let context = this.canvas.getContext('webgl2');
		if (!context) {
			context = this.canvas.getContext('webgl');
		}
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

		const gl = context;
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		this.loaded = true;
	}

	static getMaterial() {
		if (!this.material) {
			this.material = this.generateMaterial();
		}
		return this.material;
	}

	static generateMaterial() {
		if (!TextureService.loaded) {
			return console.warn("TextureService has not loaded yet");
		}
		const material = new THREE.ShaderMaterial({
			uniforms: {
				texture1: { value: TextureService.texture },
				time: {value: 0}
			},
			vertexShader: `
				precision lowp float;

				uniform float time;

				attribute vec3 instancePosition;
				attribute vec2 instanceTile;
				attribute vec3 instanceRotation;

				varying vec2 vUv;

				#define PI_HALF 1.5707963267949
				#define IMAGE_SIZE_PIXELS 128.0
				#define IMAGE_TILE_SIZE 8.0

				mat4 translateXYZ(vec3 v) {
					return mat4(
						1.0, 0.0, 0.0, 0.0,
						0.0, 1.0, 0.0, 0.0,
						0.0, 0.0, 1.0, 0.0,
						v.x, v.y, v.z, 1.0
					);
				}

				mat4 rotateXYZ(vec3 v) {
					return mat4(
						1.0,		0,			0,			0,
						0, 			cos(v.x),	-sin(v.x),	0,
						0, 			sin(v.x),	cos(v.x),	0,
						0,			0,			0, 			1
					) * mat4(
						cos(v.z),	-sin(v.z),	0,			0,
						sin(v.z),	cos(v.z),	0,			0,
						0,			0,			1,			0,
						0,			0,			0,			1
					) * mat4(
						cos(v.y),	0,			sin(v.y),	0,
						0,			1.0,		0,			0,
						-sin(v.y),	0,			cos(v.y),	0,
						0, 			0,			0,			1
					);
				}

				void main() {
					vec2 topLeftOrigin = (1.0/IMAGE_TILE_SIZE) * uv + vec2(0.0, (IMAGE_TILE_SIZE-1.)/IMAGE_TILE_SIZE);
					vUv = topLeftOrigin + vec2(1.0, -1.0) * (1.0/IMAGE_SIZE_PIXELS * (1.0+instanceTile*2.0) + vec2(1.0 / IMAGE_TILE_SIZE) * instanceTile);

					vec3 pos = position + instancePosition;

					mat4 toCenter = translateXYZ(-instancePosition);
					mat4 fromCenter = translateXYZ(instancePosition);
					mat4 transformation = fromCenter * rotateXYZ(PI_HALF*instanceRotation) * toCenter;


					vec4 resultPos = transformation * vec4(pos, 1.0);
					gl_Position = projectionMatrix * modelViewMatrix * resultPos;
				}
			`,
			fragmentShader: `
				precision lowp float;

				uniform sampler2D texture1;

				varying vec2 vUv;

				void main() {
					vec4 color = texture2D(texture1, vUv);
					if (color.a != 1.0) {
						discard;
					}
					gl_FragColor = vec4(color.xyz, 1.0);
				}
			`,
			transparent: true
		});
		material.side = THREE.FrontSide;
		return material;
	}

	draw() {
		if (this.frame < 20000) {
			this.frame++;
		} else {
			this.frame = 0;
		}
		this.renderer.render(this.scene, this.camera);
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
		data.append("content", this.renderer.domElement.toDataURL());
		data.append("filename", 'img'+countStr+'.png');
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