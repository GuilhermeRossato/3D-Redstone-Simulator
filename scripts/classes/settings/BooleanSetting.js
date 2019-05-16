import AbstractSetting from "./AbstractSetting.js";

export default class BooleanSetting extends AbstractSetting {
	constructor(value) {
		super(!!value, v=>!!v);
	}
}