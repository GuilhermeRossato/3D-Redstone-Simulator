function SettingsController(v) {
	this.parseSettings(window, v);
	this.loadSettingState();
}

SettingsController.prototype = {
	constructor: SettingsController,
	parseSettings: function(parent, obj) {
		obj.parent = obj;
	},
	loadSettingState: function() {
		if (typeof getCookie === "function") {
		}
	}
}