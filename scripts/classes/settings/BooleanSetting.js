define(["scripts/classes/settings/Setting.js"], (Setting) =>
	class BooleanSetting extends Setting {
		constructor(value) {
			super(!!value, v=>!!v);
		}
	}
);