define(["Scripts/Classes/LoadingSystem.js", "Scripts/Data/Configuration.js"], function(LoadingSystem, Configuration) {
	return class Application {
		constructor() {
			Configuration.page.title.attach(document, "title");
			
			this.loader = new LoadingSystem();
		}
	}
});