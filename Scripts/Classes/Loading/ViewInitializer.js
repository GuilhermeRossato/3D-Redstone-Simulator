define([
	"Scripts/Classes/Loading/LoadingStep.js",
	"Scripts/Views/LoadingView.js"
], (LoadingStep, ...views) => {
	class ViewInitializer extends LoadingStep {
		constructor() {
			super();
			console.log("ViewInitializer got ready to load",views.length,"views");
		}
		load() {
			return new Promise((resolve, reject) => {
				try {
					for (var view in views) {
						view.init();
					}
					this.onProgress(1);
					resolve();
				} catch (err) {
					reject(err);
				}
			});
		}
	}
});