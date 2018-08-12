define([], () => {
	var instanceCount = 0;
	var loadedCount = 0;
	var progressUpdateCallback;

	return class LoadingStep {
		constructor() {
			let _progress = 0;
			Object.defineProperty(this, "progress", {
				get: () => {
					return _progress;
				},
				set: (value) => {
					if (value-0.001 > _progress && value+0.001 < _progress) {
						return value;
					} else {
						if (typeof value === "number" && value >= 0 && value <= 1) {
							if (value < _progress) {
								if (value-0.001 < _progress) {
									console.warn("Discarted invalid value for progress:", value, "(cannot decrease from "+this._progress+")");
								} else {
									// Fail silently because it is most likely a rounding error
									return value;
								}
							} else {
								loadedCount += value - _progress;
								_progress = value;
								if (value >= 1) {
									this.loaded = true;
								}
								debugger;
								if (progressUpdateCallback instanceof Function) {
									progressUpdateCallback(this);
								}
								return value;
							}
						} else {
							console.warn("Discarted invalid value for progress:", value, "(should be a number between 0 and 1)");
						}
					}
				}
			});
			this.loaded = false;
			instanceCount++;
		}
		static on(type, func) {
			if (type === "progress-update")
				progressUpdateCallback = func;
			else
				throw new Error("Invalid event: ", type);
		}
		static getInstanceCount() {
			return instanceCount;
		}
		static getLoadedCount() {
			return loadedCount;
		}
		static getOverallProgress() {
			var stepsLoaded = LoadingStep.getLoadedCount();
			var allSteps = LoadingStep.getInstanceCount();
			return stepsLoaded/allSteps;
		}
		static makePromiseWithTimeout(promise, seconds) {
			let timeout = new Promise((resolve, reject)=>setTimeout(()=>reject(`Timeout after ${seconds.toFixed(2)} seconds`), seconds*1000));
			return Promise.race([promise, timeout]);
		}
		load() {
			var message = "Warning: load() method has not been overwritten";
			console.warn(message);
			return new Promise((resolve, reject) => reject(message));
		}
	}
});