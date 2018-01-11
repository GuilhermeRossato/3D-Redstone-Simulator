define(()=>class LoadingStep {
	constructor() {
		console.log("New loading step");
	}
	onProgress() {
		console.log("Warning: onProgress method has not been overwritten");
	}
	load() {

	}
});