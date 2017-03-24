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
					listeners.forEach((f) => f(value, x));
					if (typeof x === typeof value)
						value = x;
				} else {
					console.warn("Type Error: Was expecting "+(typeof value)+" type, got "+(typeof x)+" type.");
				}	
			}
		}
	});
	let listeners = [];
	this.attach = function(f) {
		listeners.push(f);
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

function FloatSetting(min, value, max) {
	this.min = min;
	this.max = max;
	Setting.call(this, value);
}

function IntegerSetting(min, value, max) {
	this.min = min;
	this.max = max;
	Setting.call(this, value, (value) => value|0);
}

function BooleanSetting(value) {
	Setting.call(this, value, (value) => value?true:false);
}

function KeySetting(value) {
	Setting.call(this, value);
}

function VectorSetting(x, y, z, distance) {
	let listeners = [];
	distance = Math.abs(distance||2.5);
	this.x = new FloatSetting(x-distance, x, x+distance);
	this.y = new FloatSetting(y-distance, y, y+distance);
	this.z = new FloatSetting(y-distance, z, z+distance);
	this.set = (x, y, z) => {
		listeners.forEach((f) => f({x: this.x.value, y: this.y.value, z: this.z.value}, {x: x, y: y, z: z}));
		this.x.value = x;
		this.y.value = y;
		this.z.value = z;
	}
	this.copy = (v) => {
		listeners.forEach((f) => f({x: this.x.value, y: this.y.value, z: this.z.value}, {x: x, y: y, z: z}));
		this.x.value = vec.x;
		this.y.value = vec.y;
		this.z.value = vec.z;
	}
	Object.defineProperty(this, "value", {
		get: function() {
			return value;
		},
		set: function (vec) {
			console.warn("Error: Not allowed to assign vectors");
		}
	});
	this.attach = function(f) {
		listeners.push(f);
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