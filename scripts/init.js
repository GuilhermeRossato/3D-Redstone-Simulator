'use strict';

import App from './App.js';
import ShaderController from './ShaderController.js';
import AssetLoader from './AssetLoader.js';
import FatalErrorDisplay from './FatalErrorDisplay.js';

function setLoadingText(str) {
	if (!document.querySelector(".text")) {
		return console.warn('Could not find loading text to display "'+str+'"');
	}
	document.querySelector(".text").innerText = str
}

function clearFooterText() {
	document.querySelector(".footer .footer-text").innerText = "";
}

(async function() {
	try {
		clearFooterText();

		setLoadingText("Creating WebGL Context");
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext("webgl");
		if (gl == null) {
			throw new Error("WebGL Context could not be created");
		}

		setLoadingText("Loading Assets");
		const aLoader = new AssetLoader();
		const image = aLoader.loadImage("assets/textures.png");

		setLoadingText("Loading Shaders");
		const sLoader = new ShaderController();
		const shaderPromises = ["assets/FragmentShader.glsl", "assets/VertexShader.glsl"].map(
				shader => sLoader.load(shader)
			)
		console.log("Waiting");
		const sources = await Promise.all(shaderPromises);
		console.log("done");
		if (!sources[0] || !sources[1]) {
			throw new Error("Missing shader in shader array!");
		}

		setLoadingText("Building Shaders");
		const built = await Promise.all(sources.map(shader => sLoader.build(gl, shader)));

		setLoadingText("Building Shader Program");
		const program = sLoader.join(gl, built[0], built[1]);

		setLoadingText("Initializing the App");
		(new App(canvas, program, image)).load();
	} catch (err) {
		console.error(err);
		(new FatalErrorDisplay).show(err);
	}
})();