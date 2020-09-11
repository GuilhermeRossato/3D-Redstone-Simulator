import GraphicsEngine from './graphics/GraphicsEngine.js';
import LoopHandler from './LoopHandler.js';
import WorldHandler from './classes/world/WorldHandler.js';
import Performancer from './Performancer.js';
import ControlSelectorScreen from './screens/ControlSelectorScreen.js';
import MainMenuScreen from "./screens/MainMenuScreen.js";
import App from './App.js';
import TextureService from './graphics/TextureService.js';
import GameScreen from './screens/GameScreen.js';

export default class AppLoader {
	/**
	 * @param {App} parent
	 */
	constructor(parent) {
		this.parent = parent;
	}

	async loadTextures() {
		await TextureService.load();
	}

	async loadGraphics() {
		const wrapper = document.querySelector(".background-game-canvas");
		if (!wrapper) {
			throw new Error("Missing canvas object DOM element");
		}
		this.parent.graphics = new GraphicsEngine(wrapper, this.parent.canvas, this.parent.gl);
		await this.parent.graphics.load();
		this.parent.resize();
		this.parent.attachEvents();
		this.parent.performancer = new Performancer(true, 10);
		this.parent.performancer.attach(document.body);
	}

	async loadWorld() {
		if (!this.parent.graphics) {
			throw new Error("Parent must have a graphics object adquired from a loadGraphics call");
		}
		this.parent.world = new WorldHandler(this.parent.graphics);
		await this.parent.world.load();
		this.parent.mockWorld();
	}

	async loadScreens() {
		ControlSelectorScreen.init();
		MainMenuScreen.init();
		GameScreen.init();
	}

	async loadLoop() {
		const draw = this.parent.draw;
		const update = this.parent.update;
		const overflow = this.parent.overflow;
		const performancer = this.parent.performancer;

		this.parent.loop = new LoopHandler({
			fps: 60,
			draw,
			update,
			overflow,
			performancer
		});

		update();
		draw();
		this.parent.loop.start();
	}
}