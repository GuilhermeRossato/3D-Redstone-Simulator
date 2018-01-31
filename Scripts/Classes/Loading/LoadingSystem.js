define([
	"Scripts/Classes/Loading/LoadingStep.js",
	"Scripts/Views/LoadingView.js",
	"Scripts/Classes/Loading/TextureAtlas.js",
	"Scripts/Classes/Loading/WorldGenerator.js",
], function (LoadingStep, LoadingView, TextureAtlas, WorldGenerator) {
	return class LoadingSystem extends LoadingStep {
		constructor() {
			super();
			this.textureAtlas = new TextureAtlas();
			this.loadingView = new LoadingView();
			this.worldGenerator = new WorldGenerator();
		}
		updateProgress() {
			var stepsLoaded = LoadingStep.getLoadedCount();
			var allSteps = LoadingStep.getInstanceCount();
			var progress = stepsLoaded/allSteps;
			this.loadingView.setProgress(progress);
			return progress;
		}
		async load() {
			await this.loadingView.load();
			var updateProgress = this.updateProgress.bind(this);
			this.textureAtlas.on("progress", updateProgress);
			this.worldGenerator.on("progress", updateProgress);
			await Promise.all([
				this.textureAtlas.load(),
				this.worldGenerator.load()
			]);
			if (this.updateProgress() < 1) {
				throw new Error("There were "+().toFixed(0)+" that could not be loaded");
			}
		}
	}
});