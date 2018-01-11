define([
	"Scripts/Classes/Loading/TextureAtlas.js",
], function (...steps) {
	return class LoadingSystem {
		constructor() {
			this.instances = steps.map(s => new s());
		}
		updateProgress(instance, progress) {
			
		}
		getPromiseWithTimeout(promise, seconds) {
			let timeout = new Promise((resolve, reject)=>setTimeout(()=>reject(`Timeout after ${seconds.toFixed(2)} seconds`), seconds*1000));
			return Promise.race([promise, timeout]);
		}
		processInstance(instance) {
			instance.onProgress = this.updateProgress.bind(this, instance);
			return this.getPromiseWithTimeout(instance.load(), instance.estimatedSeconds || 10);
		}
		load() {
			return Promise.all(this.instances.map(this.processInstance.bind(this)));
		}
	}
});