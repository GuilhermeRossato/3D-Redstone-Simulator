'use strict';

import AppLoader from './AppLoader.js';
import Configuration from './data/Configuration.js';
import LocalStorageService from './services/LocalStorageService.js';
import ScreenService from './screens/ScreenService.js';
import ControlSelectorScreen from './screens/ControlSelectorScreen.js';
import MainMenuScreen from './screens/MainMenuScreen.js';
import GameScreen from './screens/GameScreen.js';

import Chunk from './classes/world/Chunk.js';
import WorldHandler from './classes/world/WorldHandler.js';
import GraphicsEngine from './graphics/GraphicsEngine.js';
import Performancer from './Performancer.js';
import LoopHandler from './LoopHandler.js';
import DesktopInput from './inputs/DesktopInput.js';
import debounce from './utils/debounce.js';

export default class App {
	/**
	 *
	 * @param {HTMLCanvasElement} canvas
	 * @param {WebGLRenderingContext} gl
	 * @param {AppLoader} [loader]
	 */
	constructor(canvas, gl, loader) {
		this.canvas = canvas;
		this.gl = gl;
		this.loader = loader ? loader : (new AppLoader(this));

		/** @type {WorldHandler} */
		this.world = undefined;
		/** @type {GraphicsEngine} */
		this.graphics = undefined;

		this.update = this.update.bind(this);
		this.draw = this.draw.bind(this);
		this.overflow = this.overflow.bind(this);

		// this.cameraId = parseInt(window.localStorage.getItem('camera-id') || '1');
		this.lastCameraId = 0;
		this.cameraId = 0;

		/** @type {Performancer | undefined} */
		this.performancer;

		/** @type {LoopHandler | undefined} */
		this.loop;
	}

	attachEvents() {
		window.addEventListener('resize', debounce(this.resize.bind(this), 200));
	}

	updateCamera(id, frame) {
		if (this.lastCameraId === id && id >= 2 && id <= 4) {
			return;
		}

		if (id === 0 || id === 1 || id === 2) {
			let frame = Math.cos(2 * Math.PI * (this.frame % 1000) / 1000);
			let angle = 1.4+frame;
			// angle = 1.4;
			let scale = window['scale'] || 0.1;
			this.graphics.camera.position.x = Math.cos(angle)*64*scale;
			this.graphics.camera.position.z = Math.sin(angle)*64*scale;
			this.graphics.camera.position.y = 3;
			this.graphics.camera.lookAt(0, 0, 0);
		} else if (id === 3 || id === 4 || id === 5) {
			let angle = 0;
			if (id === 3) {
				angle = 2*Math.PI*0.1;
			} else if (id === 4) {
				angle = 2*Math.PI*1.45;
			} else if (id === 5) {
				angle = 2*Math.PI*0.52;
			}
			let scale = window['scale'] || 0.35;
			this.graphics.camera.position.x = Math.cos(angle)*10*scale;
			this.graphics.camera.position.y = 2;
			this.graphics.camera.position.z = Math.sin(angle)*10*scale;
			if (id === 5) {
				this.graphics.camera.position.y = 4;
			}
			this.graphics.camera.lookAt(-1, -1, -2);
		} else if (id === 6) {
			this.graphics.camera.position.set(0, 7, 0);
			this.graphics.camera.lookAt(0, 0, 3);
		}
	}

	update() {
		(this.screen) && (this.screen.update) && (this.screen.update());
		// Update camera around the object
		if (this.frame%20 === 19) {
			const element = document.querySelector('.footer');
			if (!element.classList.contains('closed')) {
				element.querySelector('.footer-text').innerHTML = 'Render Calls:'+
				this.graphics.renderer.info.render.calls;
			}
		}

		if (this.frame < 2000) {
			this.frame++;
		} else {
			this.frame = 0;
		}

		if (this.graphics.camera) {
			const cameraId = this.cameraId || 1;
			this.updateCamera(cameraId, this.frame);
		}
	}

	draw() {
		this.graphics.draw();
	}

	overflow() {
		// Called when 333ms has been elapsed since last update
		console.log('overflow');
	}

	mockWorld() {
		const size = 16;
		//this.world.set(0, 1, 0, 1);
		for (let i = 0; i < size; i++) {
			for (let j = 0; j < size; j++) {
				const [x, y, z] = [(i-size/2)|0, 0, (j-size/2)|0];
				this.world.set(x, y + Math.floor((x - z * 1.23) / 5), z, (i%3==0||j%3==0) ? 2 : 1);
			}
		}
		this.world.set(0, 0, 1, 6);
		//this.world.set(0, 2, 1, 4);
		this.world.set(0, 0, 2, 6);
		//setTimeout(() => {
			//this.world.set(0, 1, 0, 6);
		//}, 1000);
		//setTimeout(() => {
			this.world.set(1, 0, 1, 6);
			this.world.set(-1, 0, 1, 6);
			this.world.set(-2, 0, 1, 8);
			this.world.set(-2, 1, 1, 3);
			this.world.set(-2, 2, 1, 7);
		//}, 2000);
	}

	/**
	 * @param {string} selection
	 */
	onInputTypeSelected(selection) {
		LocalStorageService.save('inputType', selection);
		if (this.input) {
			this.input.detachEvents();
		}
		if (selection === 'desktop') {
			this.input = new DesktopInput();
		} else {
			throw new Error('Unimplemented input type');
		}
		this.input.attachEvents();
		this.selectInputType(selection);
	}

	/**
	 * @param {string} selection
	 */
	selectInputType(selection) {
		Configuration.inputType.value = selection;
		ScreenService.setScreen(this, GameScreen);
	}

	start() {
		// Mock screen because setScreen will hide the previous screen
		this.screen = {
			hide: function() {
				// @ts-ignore
				document.querySelector('.loading-screen').style.display = 'none';
			}
		}

		const skipSelect = true;
		if (skipSelect) {
			this.selectInputType('desktop');
		} else {
			ScreenService.setScreen(this, ControlSelectorScreen);
			ControlSelectorScreen.once('select', this.onInputTypeSelected.bind(this));
		}
	}

	resize() {
		this.width = this.canvas.width = window.innerWidth;
		this.height = this.canvas.height = window.innerHeight;
		this.graphics && this.graphics.resize(this.width, this.height);
		this.screen && this.screen.resize && this.screen.resize(this.width, this.height);
	}
}