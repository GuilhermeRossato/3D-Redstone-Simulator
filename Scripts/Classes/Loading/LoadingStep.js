define([
	"Scripts/Classes/Generic/Emitter.js"
], (Emitter) => {
	var instanceCount = 0;
	var loadedCount = 0;
	return class LoadingStep extends Emitter {
		constructor() {
			super();
			this.on("progress", this.__progressed.bind(this));
			this.loaded = false;
			this.lastProgress = 0;
			instanceCount++;
		}
		__progressed(progress) {
			console.log(loadedCount, instanceCount);
			//debugger;
			if (progress > 1) {
				throw new Error("Step has overload");
			}
			if (this.lastProgress != progress) {
				loadedCount += progress - this.lastProgress;
				this.lastProgress = progress;
			}
		}
		static getInstanceCount() {
			return instanceCount;
		}
		static getLoadedCount() {
			return loadedCount;
		}
		static makePromiseWithTimeout(promise, seconds) {
			let timeout = new Promise((resolve, reject)=>setTimeout(()=>reject(`Timeout after ${seconds.toFixed(2)} seconds`), seconds*1000));
			return Promise.race([promise, timeout]);
		}
		load() {
			console.log("Warning: load method has not been overwritten");
			return new Promise((resolve, reject) => reject("Load method has not been overwritten"));
		}
	}
});