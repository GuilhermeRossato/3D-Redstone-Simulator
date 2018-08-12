define([
	"scripts/classes/loading/LoadingSystem.js",
	"scripts/modules/Interface.js",
	"scripts/data/Configuration.js"
], (LoadingSystem, Interface, Configuration) =>
class Application {
	constructor() {
		Configuration.page.title.attach(document, "title");
		this.gui = new Interface();
		this.loader = new LoadingSystem();
		this.init();
	}
	async init() {
		var loader = this.loader;
		this.loader.addPhase("Loading configurations, images and the world", [
			Configuration
		]);
		try {
			await this.loader.load();
			this.gui.state = "input-selection";
			console.log("Entering Input Selection");
		} catch (err) {
			console.log("Entering error mode due to error:", err);
			this.gui.state = "show-error";
		}
	}
});
