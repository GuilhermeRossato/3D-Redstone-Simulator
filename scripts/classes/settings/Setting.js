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

define(()=> class Setting {
	constructor(value, processFunc) {
		Object.defineProperty(this, "value", {
			get: () => value,
			set: (v) => {
				if (v !== value) {
					if (typeof v === typeof value) {
						if (processFunc !== undefined)
							v = processFunc(v);
						listeners.forEach(f => f(v));
						if (typeof v === typeof value)
							value = v;
					} else {
						console.warn("Type Error: Was expecting "+(typeof value)+" type, got "+(typeof v)+" type.");
					}
				}
			}
		});
		let listeners = [];
		this.attach = function(f, g) {
			if (f instanceof Function) {
				listeners.push(f);
			} else if (typeof f === "object" && typeof g === "string") {
				f[g] = value;
				listeners.push(function(value) { f[g] = value; });
			}
		}
		this.detach = function(f) {
			let index = listeners.indexOf(f);
			if (index !== -1) {
				listeners.splice(index, 1);
			} else {
				console.warn("Could not find function on listeners");
			}
		}
		this.dispose = function() {
			listeners = undefined;
		}
	}
});
