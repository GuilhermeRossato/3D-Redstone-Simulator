/*

Description:

	Defines a primitive 'Settings' class that other objects can subscribe for changes

Usage Example:

	An object that needs to keep an updated configuration file can just do:
		(Some Setting class).attach(this, "jumpKey");
	When the value of the setting changes, so will the object's jumpKey property.
	If a function is passed as second parameter at attach, each change will call
		the function with the new value as parameter
*/

export default class AbstractSetting {
	constructor(value, processFunc) {
		const listeners = [];
		Object.defineProperty(this, "value", {
			get: () => value,
			set: (v) => {
				if (v !== value) {
					if (typeof v === typeof value) {
						if (processFunc !== undefined && this[processFunc]) {
							v = this[processFunc](v);
						}
						listeners.forEach(f => f(v));
						if (typeof v === typeof value)
							value = v;
					} else {
						console.warn("Type Error: Was expecting "+(typeof value)+" type, got "+(typeof v)+" type.");
					}
				}
			}
		});
		this.addListener = function(fn) {
			return listeners.push(fn);
		}
		this.removeListener = function(fn) {
			let index = listeners.indexOf(f);
			if (index === -1) {
				return false;
			}
			return listeners.splice(index, 1);
		}
		this.dispose = function() {
			listeners = undefined;
		}
	}
	setterFunction(f, g, value) {
		return (f[g] = value);
	}
	attach(f, g) {
		if (f instanceof Function) {
			this.addListener(f);
			return true;
		}

		if (typeof f === "object" && typeof g === "string") {
			if (f[g] != value) {
				f[g] = value;
			}
			this.addListener(this.setterFunction.bind(this, f, g));
			return true;
		}

		console.warn("Unhandled parameter types");
		return false;
	}
	detach(fn) {
		if (!this.removeListener(fn)) {
			console.warn("Could not find function on listeners");
		}
	}
}
