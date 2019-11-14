import GraphicsEngine from './graphics/GraphicsEngine.js';
import LoopHandler from './LoopHandler.js';
import WorldHandler from './classes/world/WorldHandler.js';
import Performancer from './Performancer.js';
import ControlSelectorScreen from './screens/ControlSelectorScreen.js';
import MainMenuScreen from "./screens/MainMenuScreen.js";

export default class AppLoader {
	constructor(parent, canvas) {
		this.parent = parent;
		if (!this.parent.canvas) {
			throw new Error("Parent must have a canvas DOM object as property");
		}
		if (!this.parent.gl) {
			throw new Error("Parent must have a canvas DOM object as property");
		}
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
	}
	async loadScreens() {
		ControlSelectorScreen.init();
		MainMenuScreen.init();
	}
	async loadLoop(drawFn, updateFn, overflowFn, performancerObject) {
		this.parent.loop = new LoopHandler({
			fps: 60,
			draw: drawFn,
			update: updateFn,
			overflow: overflowFn,
			performancer: performancerObject
		});
		updateFn();
		drawFn();
		this.parent.loop.start();
	}
}