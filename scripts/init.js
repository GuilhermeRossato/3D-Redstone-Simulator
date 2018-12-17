'use strict';

import App from './App.js';
import AssetLoader from './AssetLoader.js';
import FatalErrorDisplay from './FatalErrorDisplay.js';

function setLoadingText(str) {
	if (!document.querySelector(".text")) {
		return console.warn('Could not find loading text to display "'+str+'"');
	}
	document.querySelector(".text").innerText = str
}

(async function() {
	try {
		setLoadingText("Creating WebGL Context");
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext("webgl");
		if (gl == null) {
			throw new Error("WebGL Context could not be created");
		}

		setLoadingText("Loading Assets");
		const aLoader = new AssetLoader();
		const assets = {
			"textures": await aLoader.loadImage("assets/textures.png")
		};

		const app = new App(canvas, assets);

		setLoadingText("Initializing the Graphics Engine");
		app.loadGraphics();

		setLoadingText("Initializing the World");
		app.loadWorld();

		setLoadingText("Initializing the Main Loop");
		app.loadLoop();
		await new Promise(r=>setTimeout(r, 250));
		document.querySelector(".content").remove();
	} catch (err) {
		console.error(err);
		(new FatalErrorDisplay).show(err);
	}
})();