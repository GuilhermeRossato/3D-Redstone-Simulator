define([
	"Scripts/Classes/Loading/LoadingStep.js",
	"Scripts/Views/LoadingView.js",
	"Scripts/Classes/Loading/TextureAtlas.js",
	"Scripts/Classes/Loading/WorldGenerator.js",
	"Scripts/Classes/Loading/WebGLStarter.js",
], function (LoadingStep, LoadingView, TextureAtlas, WorldGenerator) {
	return class LoadingSystem {
		constructor() {
			this.textureAtlas = new TextureAtlas();
			this.loadingView = LoadingView;
			this.worldGenerator = new WorldGenerator();
		}
		updateProgress() {
			var stepsLoaded = LoadingStep.getLoadedCount();
			var allSteps = LoadingStep.getInstanceCount();
			var progress = stepsLoaded/allSteps;
			console.log("progress set to ", progress);
			this.loadingView.setProgress(progress);
			return progress;
		}
		async load() {
			await this.loadingView.load();
			console.log("ready");
			var updateProgress = this.updateProgress.bind(this);
			this.textureAtlas.on("progress", updateProgress);
			this.worldGenerator.on("progress", updateProgress);
			await Promise.all([
				this.textureAtlas.load(),
				this.worldGenerator.load(),
				
			]);
			if (this.updateProgress() < 0.9999) {
				throw new Error("There were "+(LoadingStep.getInstanceCount()-LoadingStep.getLoadedCount()).toFixed(0)+" incomplete loading steps");
			}
		}
	}
});