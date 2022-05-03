import displayFatalError from './displayFatalError.js';
import TextureHandler from './modules/TextureHandler.js';
import GraphicsHandler from './modules/GraphicsHandler.js';
import WorldHandler from './modules/WorldHandler.js';
import GameLoopHandler from './modules/GameLoopHandler.js';
import ForegroundHandler from './modules/ForegroundHandler.js';
import InputHandler from './modules/InputHandler.js';

function setLoadingText(str) {
	const textElement = document.querySelector('.text');
	if (!(textElement instanceof HTMLElement)) {
		return console.warn('Could not find loading text to display loading text');
	}
	textElement.innerText = str
}

function pauseGame() {
	GameLoopHandler.stop();
	ForegroundHandler.showPausedGame();
}

async function initialization() {
	try {
		setLoadingText('Creating WebGL Context');
		const canvas = document.createElement('canvas');
        if (!canvas) {
            throw new Error('Canvas not present on page');
        }
		const gl = canvas.getContext('webgl');
		if (gl == null) {
			throw new Error('WebGL Context could not be created');
		}

		setLoadingText('Loading Textures');
		await TextureHandler.load();

		setLoadingText('Initializing the Graphics Engine');
		const {scene, camera} = await GraphicsHandler.load(canvas, gl);

		setLoadingText('Initializing the World');
		await WorldHandler.load(scene);

		setLoadingText('Initializing the Main Loop');
		await GameLoopHandler.load(
			InputHandler.update,
			GraphicsHandler.draw,
			(ms) => {console.log('Running behind ' + ms + 'ms')}
		);

		setLoadingText('Initializing the Controls');
		await InputHandler.load(canvas, scene, camera);

		setLoadingText('Initializing the GUI');
		await ForegroundHandler.load();

		await new Promise(r=>setTimeout(r, 250));
		ForegroundHandler.start();
		GameLoopHandler.start();
	} catch (err) {
		console.error(err);
        displayFatalError(err);
	}
}

export default initialization;
