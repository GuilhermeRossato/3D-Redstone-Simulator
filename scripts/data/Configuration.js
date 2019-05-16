import FloatSetting from "../classes/settings/FloatSetting.js";
import StringSetting from "../classes/settings/StringSetting.js";

export default {
	numeric_test: new FloatSetting({min: 10, max: 50, value: 50}),
	
	camera: {
		pov: new FloatSetting({min: 70, max: 120, value: 80})
	}
};