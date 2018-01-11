define(["Scripts/Classes/Loading/LoadingSystem.js", "Scripts/Classes/Interface.js", "Scripts/Data/Configuration.js"], function(LoadingSystem, Configuration) {
	return class Application {
		constructor() {
			Configuration.page.title.attach(document, "title");
			this.gui = new Interface();
			this.loader = new LoadingSystem();
			this.loader.load().then(function(data) {
				this.gui.state = "input-selection";
			}).catch(function(data) {
				this.gui.state = "show-error";
			});
		}
	}
});
