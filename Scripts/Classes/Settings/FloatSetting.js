define(["Scripts/Classes/Settings/Setting.js"], (Setting) =>
	class FloatSetting extends Setting {
		constructor(config) {
			if (typeof config === "number") {
				super(config);
			} else if (typeof config === "object" && typeof config.value === "number") {
				if (typeof config.min === "number" && typeof config.max === "number") {
					super(config.value, v=>Math.min(Math.max(v ,config.min), config.max));
				} else if (typeof config.min === "number") {
					super(config.value, v=>Math.max(v ,config.min));
				} else if (typeof config.max === "number") {
					super(config.value, v=>Math.min(v, config.max));
				} else {
					super(config.value);
				}
			} else {
				console.warn("Invalid parameter");
				super(1);
			}
		}
	}
);