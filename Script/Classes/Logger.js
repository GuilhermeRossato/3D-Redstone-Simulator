function Logger(recipient) {
	this.domElement = document.createElement("div");
	this.domElement.className = "logger";
	recipient.appendChild(this.domElement);
}
Logger.prototype = {
	constructor: Logger,
	maxLogs: 5,
	colors: {
		//R, G, B, A => Where A is the alpha
		log: [0, 0, 0, 0.1],
		warn: [128, 0, 0, 0.2],
		error: [100, 0, 0, 0.3],
		progress: [255, 120, 10, 0.15],
		show: [0, 0, 0, 0.15]
	},
	// FadeTime in seconds
	fadeTime: 30,
	resetTimer: function() {
		if (typeof this.faderTimer !== "undefined" && typeof clearInterval === "function")
			clearInterval(this.faderTimer);
		if (typeof setInterval === "function")
			this.faderTimer = setInterval(() => this.stepTimer.call(this), 1000);
	},
	stepTimer: function() {
		let colors, textAlpha;
		let nodesLength = this.domElement.childNodes.length
		  , childs = this.domElement.childNodes;
		for (let i = 0; i < nodesLength; i++) {
			if (typeof (childs[i].fadeInt) === "number" && childs[i].fadeInt < this.fadeTime) {
				childs[i].fadeInt++;
				colors = this.colors[childs[i].type].map((o)=>parseFloat(o));
				colors[3] = interpolate([0, colors[3]], [this.fadeTime, 0]).at(childs[i].fadeInt);
				textAlpha = interpolate([0, 1], [this.fadeTime, 0]).at(childs[i].fadeInt);
				childs[i].style.backgroundColor = "rgba(" + colors.join(", ") + ")";
				childs[i].style.color = "rgba(255,255,255," + textAlpha + ")";
			}
		}
	},
	primitive_log: function(message, type) {
		let newDomElement = document.createElement("div")
		  , nodesLength = this.domElement.childNodes.length
		  , now = new Date();
		if (nodesLength + 1 > this.maxLogs)
			this.domElement.removeChild(this.domElement.lastChild);
		newDomElement.className = "log log-"+type;
		let minutes = (now.getMinutes() < 10 ? "0" : "") + now.getMinutes()
		  , seconds = (now.getSeconds() < 10 ? "0" : "") + now.getSeconds();
		newDomElement.innerText = "[" + minutes + ":" + seconds + "] " + message;
		newDomElement.type = type;
		newDomElement.style.backgroundColor = "rgba(" + this.colors[type].join(", ") + ")";
		newDomElement.fadeInt = 0;
		this.domElement.insertBefore(document.createElement("br"), this.domElement.firstChild);
		this.domElement.insertBefore(newDomElement, this.domElement.firstChild);
		this.resetTimer();
	},
	error: function() {
		this.primitive_log(Array.from(arguments).join(" "), "error");
	},
	log: function() {
		this.primitive_log(Array.from(arguments).join(" "), "log");
	},
	warn: function() {
		this.primitive_log(Array.from(arguments).join(" "), "warn");
	},
	progress: function() {
		this.primitive_log(Array.from(arguments).join(" "), "progress");
	},
	show: function() {
		this.primitive_log(Array.from(arguments).join(" "), "show");
	},
	clear: function() {
		while (this.domElement.firstChild)
			this.domElement.removeChild(this.domElement.firstChild);
	}
}
