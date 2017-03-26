function InputListener() {

	// this.events (array of objects)
	this.setupEvents();

	// this: keyCodes (array of strings), keyObjects (array of KeySetting), keyCount (length)
	this.parseKeys(Settings.keys);

	document.addEventListener("scroll",(ev)=>{this.onRawMouseScroll(ev)},false);
	document.addEventListener("mousedown",(ev)=>{this.onRawMouseDown(ev)},false);
	document.addEventListener("mousemove",(ev)=>{this.onRawMouseMove(ev)},false);
	document.addEventListener("mouseup",(ev)=>{this.onRawMouseUp(ev)},false);
	document.addEventListener("keydown",(ev)=>{this.onRawKeyDown(ev)},false);
	document.addEventListener("keyup",(ev)=>{this.onRawKeyUp(ev)},false);
	document.addEventListener("resize",(ev)=>{this.onRawResize(ev)},false);
	document.addEventListener('pointerlockchange', (ev)=>{this.onRawPointerlockChange(ev)}, false);
	document.addEventListener('pointerlockerror', (ev)=>this.onRawPointerlockError(ev), false);
	this.replaceDefaultEventListeners();

	this.relay = new InputSimulator(this);
}

InputListener.prototype = {
	constructor: InputListener,
	setupEvents: function() {
		this.events = {};
		["onMouseScroll", "onMouseDown", "onMouseMove", "onMouseUp", "onKeyDown", "onKeyUp", "onResize", "onPointerlockChange", "onPointerlockError"].forEach((eventName)=>{
			this.events[eventName] = {
				listeners: [],
				attach: function(f) {
					this.listeners.push(f);
				}
			}
		}
		);
	},
	replaceDefaultEventListeners: function() {
		let unhandled = document.addEventListener;
		document.addEventListener = (type, callback, unsafe) => {
			if (type === "scroll")
				this.events.onMouseScroll.attach(callback);
			else if (type === "mousedown")
				this.events.onMouseDown.attach(callback);
			else if (type === "mousemove")
				this.events.onMouseMove.attach(callback);
			else if (type === "mouseup")
				this.events.onMouseUp.attach(callback);
			else if (type === "keydown")
				this.events.onKeyDown.attach(callback);
			else if (type === "keyup")
				this.events.onKeyUp.attach(callback);
			else if (type === "resize")
				this.events.onResize.attach(callback);
			else if (type === "pointerlockchange")
				this.events.onPointerlockChange.attach(callback);
			else if (type === "pointerlockerror")
				this.events.onPointerlockError.attach(callback);
			else {
				console.warn("Watching unhandled event: ", type);
				unhandled(type, callback, unsafe);
			}
		}
	},
	onRawMouseScroll: function(event) {
		this.events.onMouseScroll.listeners.forEach(f => f(event));
	},
	onRawMouseDown: function(event) {
		this.events.onMouseDown.listeners.forEach(f => f(event));
	},
	onRawMouseMove: function(event) {
		this.events.onMouseMove.listeners.forEach(f => f(event));
	},
	onRawMouseUp: function(event) {
		this.events.onMouseUp.listeners.forEach(f => f(event));
	},
	onRawKeyDown: function(event) {
		this.events.onKeyDown.listeners.forEach(f => f(event));
		let index = this.keyCodes.indexOf(event.code);
		if (index !== -1) {
			if (this.keyObjects[index].value !== event.code) {
				console.warn("Not matching!");
			} else {
				this.keyObjects[index].activate("down", event);
			}
		}
	},
	onRawKeyUp: function(event) {
		this.events.onKeyUp.listeners.forEach(f => f(event));
		let index = this.keyCodes.indexOf(event.code);
		if (index !== -1) {
			if (this.keyObjects[index].value !== event.code) {
				console.warn("Not matching!");
			} else {
				this.keyObjects[index].activate("up", event);
			}
		}
	},
	onRawPointerlockChange: function(event) {
		this.events.onPointerlockChange.listeners.forEach(f => f(event));
	},
	onRawPointerlockError: function(event) {
		this.events.onPointerlockError.listeners.forEach(f => f(event));
	},
	addKey: function(keyObject, index) {
		this.keyCodes.push("");
		this.keyObjects.push(keyObject);
		keyObject.attach(this.keyCodes, index.toString());
	},
	_recursiveParseKeys: function(object) {
		if (object instanceof KeySetting) {
			this.addKey(object, this.keyCount);
		} else if (object && object.attach === undefined) {
			this.forEachPropertyInObject(object, (property,object)=>{
				this._recursiveParseKeys(object);
			}
			);
		}
	},
	parseKeys: function(object) {
		this.keyCodes = [];
		this.keyObjects = [];
		this.keyCount = 0;
		this._recursiveParseKeys(object);
	},
	forEachPropertyInObject: function(object, f) {
		for (var property in object) {
			if (object.hasOwnProperty(property)) {
				f(property, object[property]);
			}
		}
	}
}