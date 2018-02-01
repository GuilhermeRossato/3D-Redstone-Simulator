define([
	"Scripts/Classes/Loading/LoadingStep.js",
	"Scripts/Data/BlockData.js"
], (LoadingStep, BlockData) =>
	class WorldGenerator extends LoadingStep {
		constructor() {
			super();
		}
		load() {
			// Simulate Load
			return new Promise((resolve) => {
				this.emit("progress", 0.2);
				setTimeout(()=>this.emit("progress", 0.5), 2000);
				setTimeout(()=>this.emit("progress", 0.7), 3500);
				setTimeout(resolve, 5000);
			})
		}
	}
);