define(["scripts/Classes/Settings/Setting.js"], (Setting) =>
	class BooleanSetting extends Setting {
		constructor(value) {
			super(!!value, v=>!!v);
		}
	}
);