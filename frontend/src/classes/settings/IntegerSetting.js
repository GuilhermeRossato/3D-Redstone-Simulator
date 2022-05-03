import AbstractSetting from "./AbstractSetting.js";

export default class IntegerSetting extends AbstractSetting {
	/**
	 * @param {number | {default: number, min?: number, max?: number}} config
	 */
	constructor(config) {
		if (typeof config === "undefined") {
			throw new Error("Missing setting parameter");
		}

		if (typeof config === "number") {
			super(config, (v) => Math.min(Math.max(v, this.min), this.max));
			this.min = Number.NEGATIVE_INFINITY;
			this.max = Number.POSITIVE_INFINITY;
		} else if (typeof config === "object" && typeof config.default === "number") {
			super(config.default, (v) => Math.min(Math.max(v, this.min), this.max));
			this.min = (typeof config.min === "number") ? config.min : Number.NEGATIVE_INFINITY;
			this.max = (typeof config.max === "number") ? config.max : Number.POSITIVE_INFINITY;
		} else {
			throw new Error("Invalid parameter options");
		}
	}
}