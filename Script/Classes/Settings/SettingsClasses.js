function Setting(defaultValue, processFunc) {
	let value = defaultValue;
	processFunc = processFunc;
	Object.defineProperty(this, "value", {
		get: function() {
			return value;
		},
		set: function (x) {
			if (x !== value) {
				if (processFunc !== undefined)
					x = processFunc(x);
				if (typeof x === typeof value) {
					listeners.forEach((f) => f(x));
					if (typeof x === typeof value)
						value = x;
				} else {
					console.warn("Type Error: Was expecting "+(typeof value)+" type, got "+(typeof x)+" type.");
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
		listeners = [];
	}
}

function FloatSetting(min, max, value) {
	if ((min !== max) && (min > max || value > max || value < min))
		console.warn("Your parameter order is wrong.");
	this.min = min;
	this.max = max;
	Setting.call(this, value);
}

function IntegerSetting(min, max, value) {
	if ((min !== max) && (min > max || value > max || value < min))
		console.warn("Your parameter order is wrong.");
	this.min = min;
	this.max = max;
	Setting.call(this, value, (value) => value|0);
}

function BooleanSetting(value) {
	Setting.call(this, value, (value) => value?true:false);
}

function KeySetting(value) {
	let listeners = {down: [], up: []};
	this.attachEvent = (type, callback) => {
		if (callback instanceof Function) {
			if (type === "keyup" || type == "onkeyup")
				listeners.up.push(callback);
			else if (type === "keydown" || type == "onkeydown")
				listeners.down.push(callback);
			else
				console.warn("Invalid event type");
		} else {
			console.warn("Invalid callback");
		}
	}
	// Called by InputListener
	this.activate = function(type, event) {
		let array;
		if (type === "down") {
			array = listeners.down;
		} else if (type === "up") {
			array = listeners.up;
		} else {
			console.warn("Invalid type");
			return;
		}
		array.forEach(f => f(event));
	}
	Setting.call(this, value);
}

function VectorSetting(x, y, z, distance) {
	let listeners = [];
	distance = Math.abs(distance||2.5);
	this.x = new FloatSetting(x-distance, x+distance, x);
	this.y = new FloatSetting(y-distance, y+distance, y);
	this.z = new FloatSetting(y-distance, z+distance, z);
	this.set = (x, y, z) => {
		this.x.value = x;
		this.y.value = y;
		this.z.value = z;
	}
	this.copy = (v) => {
		this.x.value = vec.x;
		this.y.value = vec.y;
		this.z.value = vec.z;
	}
	Object.defineProperty(this, "value", {
		get: function() {
			return {x: this.x.value, y:this.y.value, z:this.z.value};
		},
		set: function (vec) {
			if (vec instanceof Array) {
				this.x.value = vec[0];
				this.y.value = vec[1];
				this.z.value = vec[2];
			} else if (vec instanceof Object) {
				this.x.value = vec.x;
				this.y.value = vec.y;
				this.z.value = vec.z;
			}
		}
	});
	this.attach = function() {
		console.warn("Attach directly to axis!");
	}
}