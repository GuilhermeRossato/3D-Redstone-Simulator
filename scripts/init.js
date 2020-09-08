'use strict';

import App from './App.js';
import AssetLoader from './classes/AssetLoader.js';
import FatalErrorDisplay from './FatalErrorDisplay.js';

function setLoadingText(str) {
	const textElement = document.querySelector(".text");
	if (!(textElement instanceof HTMLElement)) {
		return console.warn('Could not find loading text to display "'+str+'"');
	}
	textElement.innerText = str
}

(async function() {
	try {
		setLoadingText("Creating WebGL Context");
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext("webgl");
		if (gl == null) {
			throw new Error("WebGL Context could not be created");
		}

		const app = new App(canvas, gl);

		window["app"] = app;

		setLoadingText("Loading Textures");
		await app.loader.loadTextures();

		setLoadingText("Initializing the Graphics Engine");
		await app.loader.loadGraphics();

		setLoadingText("Initializing the World");
		await app.loader.loadWorld();

		setLoadingText("Initializing the Main Loop");
		await app.loader.loadLoop();

		setLoadingText("Initializing the GUI");
		await app.loader.loadScreens();

		await new Promise(r=>setTimeout(r, 250));
		app.start();
	} catch (err) {
		console.error(err);
		(new FatalErrorDisplay).show(err);
	}
})();