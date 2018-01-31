define([
	"Scripts/Classes/Generic/Emitter.js"
], (Emitter) =>
	class LoadingStep {
		constructor() {
		}
		load() {
			console.log("Warning: load method has not been overwritten");
			return new Promise((resolve, reject) => reject("Load method has not been overwritten"));
		}
	}
);