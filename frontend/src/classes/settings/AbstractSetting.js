/*

Usage Example:

	An object that needs to keep an updated configuration file can just do:
		(Some Setting class).attach(this, "jumpKey");
	When the value of the setting changes, so will the object's jumpKey property.
	If a function is passed as second parameter at attach, each change will call
		the function with the new value as parameter
*/

/**
 * Defines a primitive 'Settings' class that other objects can subscribe for changes
 *
 */
export default class AbstractSetting {
	/**
	 *
	 * @param {any} value
	 * @param {(any) => any} [processFunc] Optional function to overwrite a value change
	 */
	constructor(value, processFunc) {
		const listeners = [];

		Object.defineProperty(this, "value", {
			get: () => value,
			set: (v) => {
				if (v !== value) {
					if (processFunc) {
						v = processFunc(v);
					}
					if (typeof v !== typeof value) {
						console.warn(`Unexpected setting value type change: Original was '${typeof value}', new is "${typeof v}"`);
					}
					listeners.forEach(f => f(v));
					value = v;
				}
			}
		});

		/** @type {any} */
		this.value;

		this.addListener = function(fn) {
			return listeners.push(fn);
		}

		this.removeListener = function(fn) {
			let index = listeners.indexOf(fn);
			if (index === -1) {
				return false;
			}
			return listeners.splice(index, 1);
		}

		this.dispose = function() {
			listeners.length = 0;
		}
	}

	attach(f) {
		if (!(f instanceof Function)) {
			console.warn("Unhandled parameter types");
			return false;
		}
		this.addListener(f);
		return true;
	}

	/**
	 * @param {any} obj Object in which the property exists
	 * @param {string} key The property key in the object
	 */
	attachOnProperty(obj, key) {
		if (obj[key] != this.value) {
			obj[key] = this.value;
		}
		this.attach(this._setterFunction.bind(this, obj, key));
		return true;
	}

	/**
	 * @param {any} fn
	 */
	detach(fn) {
		if (!this.removeListener(fn)) {
			console.warn("Could not find function on listeners");
		}
	}

	/**
	 * Internal helper function used to set the property of an object to match the setting value
	 * @param {any} obj Object in which a property has to match the setting
	 * @param {string} key The property in the object to be set
	 * @param {any} value The value that the value has been set
	 */
	_setterFunction(obj, key, value) {
		return (obj[key] = value);
	}
}
