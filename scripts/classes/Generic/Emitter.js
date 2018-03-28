define(()=>
class Emitter {
	constructor() {
		this.events = [];
	}
	addEventListener(type, func) {
		if (this.events[type] instanceof Function) {
			this.events[type] = [this.events[type], func];
		} else if (this.events[type] instanceof Array) {
			this.events[type].push(func);
		} else {
			this.events[type] = func;
		}
	}
	on(type, func) {
		this.addEventListener(type, func);
	}
	emit(type, ...data) {
		if (this.events[type] instanceof Function) {
			this.events[type].call(this, ...data);
		} else if (this.events[type] instanceof Array) {
			this.events[type].forEach(func => func.call(this, ...data));
		}
	}
	hasListener(type) {
		return !!this.events[type];
	}
});
