import FloatSetting from "../classes/settings/FloatSetting.js";
import StringSetting from "../classes/settings/StringSetting.js";
import EnumSetting from "../classes/settings/EnumSetting.js";

export default {
	inputType: new EnumSetting({
		default: "unknown",
		options: ["unknown", "desktop", "mobile", "gamepad"]
	}),
	camera: {
		pov: new FloatSetting({min: 70, max: 120, default: 80})
	},
	rendering: {
		ao: new EnumSetting({
			default: "enabled",
			options: ["enabled", "disabled"]
		}),
	}
};