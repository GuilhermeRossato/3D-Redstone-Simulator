define([
	"scripts/classes/loading/LoadingStep.js",
	"scripts/data/BlockData.js"
], (LoadingStep, BlockData) =>
	class WorldGenerator extends LoadingStep {
		constructor() {
			super();
		}
		load() {
			// Simulate Load
			return new Promise((resolve) => {
				this.emit("progress", 0.2);
				setTimeout(()=>this.emit("progress", 0.35), 1000);
				setTimeout(()=>this.emit("progress", 0.5), 2000);
				setTimeout(()=>this.emit("progress", 0.7), 3000);
				setTimeout(()=>{
					this.emit("progress", 1);
					console.log("World gen done");
					resolve();
				}, 4000);
			})
		}
	}
);