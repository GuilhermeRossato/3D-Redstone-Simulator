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
		this.canSend = true;
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

		// this.constructor.addLightToScene(scene);

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
				attribute vec3 instanceVisual;

				varying vec2 vUv;
				varying vec2 vLightness;
				varying vec2 vRelativeUv;

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
					vRelativeUv = uv;
					vUv = topLeftOrigin + vec2(1.0, -1.0) * (1.0/IMAGE_SIZE_PIXELS * (1.0 + instanceTile*2.0) + vec2(1.0 / IMAGE_TILE_SIZE) * instanceTile);
					vLightness = instanceVisual.yz;
					vec3 pos = position + instancePosition;

					mat4 toCenter = translateXYZ(-instancePosition);
					mat4 fromCenter = translateXYZ(instancePosition);

					vec3 rot;

					if (instanceVisual.x == 0.0) {
						rot = vec3(0.0, 0.0, 0.0);
					} else if (instanceVisual.x == 1.0) {
						rot = vec3(0.0, -2.0, 0.0);
					} else if (instanceVisual.x == 2.0) {
						rot = vec3(0.0, -1.0, 0.0);
					} else if (instanceVisual.x == 3.0) {
						rot = vec3(0.0, 1.0, 0.0);
					} else if (instanceVisual.x == 4.0) {
						rot = vec3(1.0, 0.0, 0.0);
					} else if (instanceVisual.x == 5.0) {
						rot = vec3(-1.0, 0.0, 0.0);
					}

					mat4 transformation = fromCenter * rotateXYZ(PI_HALF*rot) * toCenter;

					vec4 resultPos = transformation * vec4(pos, 1.0);
					gl_Position = projectionMatrix * modelViewMatrix * resultPos;
				}
			`,
			fragmentShader: `
				uniform sampler2D texture1;

				varying vec2 vUv;
				varying vec2 vLightness;
				varying vec2 vRelativeUv;

				#define AO_IMPACT 0.3

				void main() {
					vec4 color = texture2D(texture1, vUv);
					if (color.a != 1.0) {
						discard;
					}

					float aoMult;

					if (vLightness.y == 0.0) { // nothing
						aoMult = (1.0);
					} else if (vLightness.y == 208.0) {
						// all corners but bottom right
						aoMult = (1.0 - max(min(vRelativeUv.y, vRelativeUv.x),max(min(vRelativeUv.y, 1.0 - vRelativeUv.x),min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x))) * AO_IMPACT);
					} else if (vLightness.y == 176.0) {
						// all corners but bottom left
						aoMult = (1.0 - max(min(vRelativeUv.y, vRelativeUv.x),max(min(vRelativeUv.y, 1.0 - vRelativeUv.x),min(1.0 - vRelativeUv.y, vRelativeUv.x))) * AO_IMPACT);
					} else if (vLightness.y == 112.0) {
						// all corners but top left
						aoMult = (1.0 - max(min(vRelativeUv.y, vRelativeUv.x),max(min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),min(1.0 - vRelativeUv.y, vRelativeUv.x))) * AO_IMPACT);
					} else if (vLightness.y == 224.0) {
						// all corners but top right
						aoMult = (1.0 - max(min(vRelativeUv.y, 1.0 - vRelativeUv.x),max(min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),min(1.0 - vRelativeUv.y, vRelativeUv.x))) * AO_IMPACT);
					} else if (vLightness.y == 128.0) {
						 // top left
						aoMult = (1.0 - (1.0 - max(1.0 - vRelativeUv.y, vRelativeUv.x)) * AO_IMPACT);
					} else if (vLightness.y == 1.0 || vLightness.y == 17.0 || vLightness.y == 129.0 || vLightness.y == 145.0) {
						// top
						aoMult = (1.0 - vRelativeUv.y * AO_IMPACT);
					} else if (vLightness.y == 16.0) {
						// top right
						aoMult = (1.0 - (1.0 - max(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x)) * AO_IMPACT);
					} else if (vLightness.y == 8.0 || vLightness.y == 72.0 || vLightness.y == 136.0 || vLightness.y == 200.0) {
						// left
						aoMult = (1.0 - (1.0 - vRelativeUv.x) * AO_IMPACT);
					} else if (vLightness.y == 2.0 || vLightness.y == 18.0 || vLightness.y == 34.0 || vLightness.y == 50.0) {
						// right
						aoMult = (1.0 - vRelativeUv.x * AO_IMPACT);
					} else if (vLightness.y == 64.0) {
						// bottom left
						aoMult = (1.0 - (1.0 - max(vRelativeUv.y, vRelativeUv.x)) * AO_IMPACT);
					} else if (vLightness.y == 4.0 || vLightness.y == 36.0 || vLightness.y == 68.0 || vLightness.y == 100.0) {
						// bottom
						aoMult = (1.0 - (1.0 - vRelativeUv.y) * AO_IMPACT);
					} else if (vLightness.y == 32.0) {
						// bottom right
						aoMult = (1.0 - (1.0 - max(vRelativeUv.y, 1.0 - vRelativeUv.x)) * AO_IMPACT);
					} else if (vLightness.y == 9.0 || vLightness.y == 25.0 || vLightness.y == 73.0 || vLightness.y == 89.0 || vLightness.y == 137.0 || vLightness.y == 153.0 || vLightness.y == 201.0 || vLightness.y == 217.0) {
						// top, left
						aoMult = (1.0 - (1.0 - min(1.0 - vRelativeUv.y, vRelativeUv.x)) * AO_IMPACT);
					} else if (vLightness.y == 3.0 || vLightness.y == 19.0 || vLightness.y == 35.0 || vLightness.y == 51.0 || vLightness.y == 131.0 || vLightness.y == 147.0 || vLightness.y == 163.0 || vLightness.y == 179.0) {
						// top, right
						aoMult = (1.0 - (1.0 - min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x)) * AO_IMPACT);
					} else if (vLightness.y == 6.0 || vLightness.y == 22.0 || vLightness.y == 38.0 || vLightness.y == 54.0 || vLightness.y == 70.0 || vLightness.y == 86.0 || vLightness.y == 102.0 || vLightness.y == 118.0) {
						// bottom, right
						aoMult = (1.0 - (1.0 - min(vRelativeUv.y, 1.0 - vRelativeUv.x)) * AO_IMPACT);
					} else if (vLightness.y == 12.0 || vLightness.y == 44.0 || vLightness.y == 76.0 || vLightness.y == 108.0 || vLightness.y == 140.0 || vLightness.y == 172.0 || vLightness.y == 204.0 || vLightness.y == 236.0) {
						// bottom, left
						aoMult = (1.0 - (1.0 - min(vRelativeUv.y, vRelativeUv.x)) * AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 1.0 && mod(floor(vLightness.y/2.0), 2.0) == 1.0 && mod(floor(vLightness.y/4.0), 2.0) == 1.0 && mod(floor(vLightness.y/8.0), 2.0) == 0.0) {
						// top, right, bottom, no left
						aoMult = (1.0 - (1.0 - min(0.5-abs(vRelativeUv.y-0.5), 1.0-vRelativeUv.x))*AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 0.0 && mod(floor(vLightness.y/2.0), 2.0) == 1.0 && mod(floor(vLightness.y/4.0), 2.0) == 1.0 && mod(floor(vLightness.y/8.0), 2.0) == 1.0) {
						// right, bottom, left, no right
						aoMult = (1.0 - (1.0 - min(0.5-abs(vRelativeUv.x-0.5), vRelativeUv.y))*AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 1.0 && mod(floor(vLightness.y/2.0), 2.0) == 0.0 && mod(floor(vLightness.y/4.0), 2.0) == 1.0 && mod(floor(vLightness.y/8.0), 2.0) == 1.0) {
						// top, bottom, left, no right
						aoMult = (1.0 - (1.0 - min(0.5-abs(vRelativeUv.y-0.5), vRelativeUv.x))*AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 1.0 && mod(floor(vLightness.y/2.0), 2.0) == 1.0 && mod(floor(vLightness.y/4.0), 2.0) == 0.0 && mod(floor(vLightness.y/8.0), 2.0) == 1.0) {
						// top, right, left, no bottom
						aoMult = (1.0 - (1.0 - min(0.5-abs(vRelativeUv.x-0.5), 1.0-vRelativeUv.y))*AO_IMPACT);
					} else if (vLightness.y == 144.0) {
						// top left, top right
						aoMult = (1.0 - max(
							min(vRelativeUv.y, 1.0 - vRelativeUv.x),
							min(vRelativeUv.y, vRelativeUv.x)
						) * AO_IMPACT);
					} else if (vLightness.y == 48.0) {
						// top right, bottom right
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.y, vRelativeUv.x),
							min(vRelativeUv.y, vRelativeUv.x)
						) * AO_IMPACT);
					} else if (vLightness.y == 96.0) {
						// bottom left, bottom right
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),
							min(1.0 - vRelativeUv.y, vRelativeUv.x)
						) * AO_IMPACT);
					} else if (vLightness.y == 192.0) {
						// top left, bottom left
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),
							min(vRelativeUv.y, 1.0 - vRelativeUv.x)
						) * AO_IMPACT);
					} else if (vLightness.y == 80.0) {
						 // top right, bottom left
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),
							min(vRelativeUv.y, vRelativeUv.x)
						) * AO_IMPACT);
					} else if (vLightness.y == 160.0) {
						 // top left, bottom right
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.y, vRelativeUv.x),
							min(vRelativeUv.y, 1.0 - vRelativeUv.x)
						) * AO_IMPACT);
					} else if (vLightness.y == 65.0 || vLightness.y == 81.0 || vLightness.y == 193.0 || vLightness.y == 209.0) {
						// top, bottom left
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),
							vRelativeUv.y
						) * AO_IMPACT);
					} else if (vLightness.y == 33.0 || vLightness.y == 49.0 || vLightness.y == 161.0 || vLightness.y == 177.0) {
						// top, bottom right
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.y, vRelativeUv.x),
							vRelativeUv.y
						) * AO_IMPACT);
					} else if (vLightness.y == 130.0 || vLightness.y == 146.0 || vLightness.y == 162.0 || vLightness.y == 178.0) {
						// right, top left
						aoMult = (1.0 - max(
							min(vRelativeUv.y, 1.0 - vRelativeUv.x),
							vRelativeUv.x
						) * AO_IMPACT);
					} else if (vLightness.y == 66.0 || vLightness.y == 82.0 || vLightness.y == 98.0 || vLightness.y == 114.0) {
						// right, bottom left
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),
							vRelativeUv.x
						) * AO_IMPACT);
					} else if (vLightness.y == 132.0 || vLightness.y == 164.0 || vLightness.y == 196.0 || vLightness.y == 228.0) {
						// bottom, top left
						aoMult = (1.0 - max(
							min(1.0 - vRelativeUv.x, vRelativeUv.y),
							1.0 - vRelativeUv.y
						) * AO_IMPACT);
					} else if (vLightness.y == 20.0 || vLightness.y == 52.0 || vLightness.y == 84.0 || vLightness.y == 116.0) {
						// bottom, top right
						aoMult = (1.0 - max(
							min(vRelativeUv.x, vRelativeUv.y),
							1.0 - vRelativeUv.y
						) * AO_IMPACT);
					} else if (vLightness.y == 24.0 || vLightness.y == 88.0 || vLightness.y == 152.0 || vLightness.y == 216.0) {
						// left, top right
						aoMult = (1.0 - max(
							min(vRelativeUv.x, vRelativeUv.y),
							1.0 - vRelativeUv.x
						) * AO_IMPACT);
					} else if (vLightness.y == 40.0 || vLightness.y == 104.0 || vLightness.y == 168.0 || vLightness.y == 232.0) {
						// left, bottom right
						aoMult = (1.0 - max(
							min(vRelativeUv.x, 1.0 - vRelativeUv.y),
							1.0 - vRelativeUv.x
						) * AO_IMPACT);
					} else if (vLightness.y == 97.0 || vLightness.y == 113.0 || vLightness.y == 225.0 || vLightness.y == 241.0) {
						// top, bottom left, bottom right
						aoMult = (1.0 - max(
							max(
								min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),
								min(1.0 - vRelativeUv.y, vRelativeUv.x)
							),
							vRelativeUv.y
						) * AO_IMPACT);
					} else if (vLightness.y == 194.0 || vLightness.y == 210.0 || vLightness.y == 226.0 || vLightness.y == 242.0) {
						// top, bottom left, bottom right
						aoMult = (1.0 - max(
							max(
								min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x),
								min(vRelativeUv.y, 1.0 - vRelativeUv.x)
							),
							vRelativeUv.x
						) * AO_IMPACT);
					} else if (vLightness.y == 148.0 || vLightness.y == 180.0 || vLightness.y == 212.0 || vLightness.y == 244.0) {
						// bottom, top left, top right
						aoMult = (1.0 - max(
							max(
								min(vRelativeUv.y, 1.0 - vRelativeUv.x),
								min(vRelativeUv.y, vRelativeUv.x)
							),
							1.0 - vRelativeUv.y
						) * AO_IMPACT);
					} else if (vLightness.y == 56.0 || vLightness.y == 120.0 || vLightness.y == 184.0 || vLightness.y == 248.0) {
						// bottom, top left, top right
						aoMult = (1.0 - max(
							max(
								min(1.0 - vRelativeUv.y, vRelativeUv.x),
								min(vRelativeUv.y, vRelativeUv.x)
							),
							1.0 - vRelativeUv.x
						) * AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 1.0 && mod(floor(vLightness.y/4.0), 2.0) == 1.0 && mod(floor(vLightness.y/2.0), 2.0) == 1.0 && mod(floor(vLightness.y/8.0), 2.0) == 1.0) {
						// all 4 sides
						aoMult = (1.0 - max(max(max(vRelativeUv.y, 1.0-vRelativeUv.x), vRelativeUv.x), 1.0 - vRelativeUv.y) * AO_IMPACT);
					} else if ( mod(vLightness.y, 2.0) == 1.0 && mod(floor(vLightness.y/4.0), 2.0) == 1.0 ) {
						// top, bottom
						aoMult = (1.0 - max(vRelativeUv.y, 1.0 - vRelativeUv.y) * AO_IMPACT);
					} else if ( mod(floor(vLightness.y/2.0), 2.0) == 1.0 && mod(floor(vLightness.y/8.0), 2.0) == 1.0 ) {
						// left, right
						aoMult = (1.0 - max(vRelativeUv.x, 1.0 - vRelativeUv.x) * AO_IMPACT);
					} else if (vLightness.y == 240.0) {
						// all corners
						aoMult = (1.0 - max(max(
							min(vRelativeUv.y, vRelativeUv.x),
							min(1.0 - vRelativeUv.y, vRelativeUv.x)
						), max(
							min(vRelativeUv.y, 1.0 - vRelativeUv.x),
							min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x)
						)) * AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 1.0 && mod(floor(vLightness.y/2.0), 2.0) == 0.0 && mod(floor(vLightness.y/4.0), 2.0) == 0.0 && mod(floor(vLightness.y/8.0), 2.0) == 1.0) {
						// top, left, probably bottom right
						aoMult = (1.0 - (1.0 - min(max(vRelativeUv.y, 1.0 - vRelativeUv.x), min(1.0 - vRelativeUv.y, vRelativeUv.x))) * AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 1.0 && mod(floor(vLightness.y/2.0), 2.0) == 1.0 && mod(floor(vLightness.y/4.0), 2.0) == 0.0 && mod(floor(vLightness.y/8.0), 2.0) == 0.0) {
						// top, right, probably bottom left
						aoMult = (1.0 - (1.0 - min(max(vRelativeUv.y, vRelativeUv.x), min(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x))) * AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 0.0 && mod(floor(vLightness.y/2.0), 2.0) == 1.0 && mod(floor(vLightness.y/4.0), 2.0) == 1.0 && mod(floor(vLightness.y/8.0), 2.0) == 0.0) {
						// bottom, right, probably top left
						aoMult = (1.0 - (1.0 - min(max(1.0 - vRelativeUv.y, vRelativeUv.x), min(vRelativeUv.y, 1.0 - vRelativeUv.x))) * AO_IMPACT);
					} else if (mod(vLightness.y, 2.0) == 0.0 && mod(floor(vLightness.y/2.0), 2.0) == 0.0 && mod(floor(vLightness.y/4.0), 2.0) == 1.0 && mod(floor(vLightness.y/8.0), 2.0) == 1.0) {
						// left, bottom, probably top right
						aoMult = (1.0 - (1.0 - min(max(1.0 - vRelativeUv.y, 1.0 - vRelativeUv.x), min(vRelativeUv.y, vRelativeUv.x))) * AO_IMPACT);
					}

					gl_FragColor = vec4(color.xyz * vLightness.x * aoMult, 1.0);

					// disable texture and use only AO
					// if (vLightness.y >= 0.0 && vLightness.y <= 1288.0) { gl_FragColor = vec4(aoMult.xyz, 1.0); }
				}
			`,
			transparent: true
		});
		material.side = THREE.FrontSide;
		return material;
	}

	draw() {
		this.renderer.render(this.scene, this.camera);
	}

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