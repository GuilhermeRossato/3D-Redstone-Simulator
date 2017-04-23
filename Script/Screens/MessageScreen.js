const MessageScreen = {
	setLabelData: function(label, data) {
		let span = document.createElement("span");
		for (var property in data) {
			if (property === "innerText") {
				span.innerText = data[property];
			} else if (data.hasOwnProperty(property)) {
				span.setAttribute(property, data[property]);
			}
		}
		return span;
	},
	init: function(domElement) {
		this.primary = document.getElementById("primary");
		if (!this.primary)
			throw "Missing Error: Base element not found (id='primary')";
		this.spans = [];
		this.shown = false;
	},
	isShown: function() {
		return this.shown;
	},
	show: function() {
		this.shown = true;
		this.spans.forEach(span => this.primary.appendChild(span));
	},
	hide: function() {
		this.shown = false;
		this.spans.forEach(span => this.primary.removeChild(span));
	},
	setMinimumLabelCount: function(size) {
		if (this.labels.length < size) {
			repeat(size-this.labels.length, i => this.labels.push(document.createElement("div")));
			if (this.shown)
				repeat(size-this.labels.length, i => this.primary.appendChild(this.labels[this.labels.length-i-1]));
		}
	},
	setAttributes: function(...formats) {
		setMinimumLabelCount(formats.length);
		formats.forEach((format,i)=>this.setLabelData(this.labels[i], format));
	},
	setText: function(...texts) {
		this.setAttributes(...texts.map(text=>{innerText:text}));
	}
}