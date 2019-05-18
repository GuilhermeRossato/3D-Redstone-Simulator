import AbstractSetting from "./AbstractSetting.js";

export default class FloatSetting extends AbstractSetting {
	constructor(config) {
		if (typeof config === "undefined") {
			throw new Error("Missing setting parameter");
		}

		if (typeof config === "number") {
			super(config, "transformValue");
			this.min = Number.NEGATIVE_INFINITY;
			this.max = Number.POSITIVE_INFINITY;
		} else if (typeof config === "object" && typeof config.default === "number") {
			super(config.default, "transformValue");
			this.min = (typeof config.min === "number")?config.min:Number.NEGATIVE_INFINITY;
			this.max = (typeof config.max === "number")?config.max:Number.POSITIVE_INFINITY;
		} else {
			throw new Error("Invalid parameter options");
		}
	}
	transformValue(v) {
		return Math.min(Math.max(v, this.min), this.max);
	}
}