
'use strict';

import TextureHandler from '../../TextureHandler.js';

export default class WorldHandler {
	constructor(graphicsEngine) {
		this.scene = graphicsEngine.scene;
		this.blocks = [];
		this.blockList = [];
		this.allFaces = [];
		this.faces = [];
	}

	load() {
		this.textures = new TextureHandler(this);
		this.textures.load();
	}
}