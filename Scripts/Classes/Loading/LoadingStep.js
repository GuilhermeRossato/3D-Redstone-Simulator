define([
	"Scripts/Classes/Generic/Emitter.js"
], (Emitter) => {
	var instanceCount = 0;
	var loadedCount = 0;
	return class LoadingStep extends Emitter {
		constructor() {
			super();
			this.on("progress", this.checkStatus.bind(this));
			this.loaded = false;
			instanceCount++;
		}
		checkStatus(progress) {
			if (progress >= 1 && !this.loaded) {
				this.loaded = true;
				loadedCount++;
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