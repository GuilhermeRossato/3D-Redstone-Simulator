import AbstractSetting from "./AbstractSetting.js";

export default class EnumSetting extends AbstractSetting {
	constructor(config) {
		if (typeof config !== "object") {
			throw new Error("Missing config object");
		} else if (typeof config.options !== "object" || !config.options.length) {
			throw new Error("Missing options array at config");
		} else if ((typeof config.default !== "undefined") && config.options.indexOf(config.default) === -1) {
			throw new Error("Enum setting starting value must exist on options array, got '"+config.default+"'");
		}

		const value = (typeof config.default !== "undefined") ? config.default : config.options[0];

		super(value, (newValue) => {
			if (!config.options.contains(newValue)) {
				console.warn(`Invalid option for enum setting: ${newValue}`);
				return this.value;
			}
			return newValue;
		});

		this.options = config.options;
	}

	getEnumIndex() {
		return this.options.indexOf(this.value);
	}
}