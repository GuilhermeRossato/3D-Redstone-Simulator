define(["Scripts/Classes/Settings/Setting.js"], (Setting) =>
	class BooleanSetting extends Setting {
		constructor(value) {
			super(!!value, v=>!!v);
		}
	}
);