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

		const value = (typeof config.default !== "undefined")?config.default:config.options[0];
		super(value, "transformValue");

		this.options = config.options;
	}
	transformValue(newValue) {
		if (typeof newValue === "string") {
			if (this.options.indexOf(newValue) !== -1) {
				return newValue;
			} else {
				console.warn("Invalid option for enum setting: "+newValue);
			}
		} else if (typeof newValue === "number") {
			if (typeof this.options[newValue] === "string") {
				return this.options[newValue];
			} else {
				console.warn("Invalid id for enum setting: "+newValue);
			}
		}
	}
	getEnumIndex() {
		return this.options.indexOf(this.value);
	}
}