define([
	"Scripts/Classes/TextureAtlas.js",
], function (...steps) {
	return class LoadingSystem {
		constructor() {
			this.instances = steps.map(s => new s());
		}
	}
});