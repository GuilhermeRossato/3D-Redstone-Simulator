define([
	"scripts/classes/settings/FloatSetting.js",
	"scripts/classes/settings/StringSetting.js"
],(FloatSetting, StringSetting)=>({
	numeric: new FloatSetting({min: 10, max: 50, value: 50}),
	page: {
		title: new StringSetting("Redstone Simulator")
	}
}));