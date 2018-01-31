define(()=>class LoadingStep {
	constructor() {
		
	}
	updateProgress() {
		console.log("Warning: onProgress method has not been overwritten");
	}
	load() {
		console.log("Warning: load method has not been overwritten");
		return new Promise((resolve, reject) => reject("Load method has not been overwritten"));
	}
});