const GamepadInstructionScreen = {
	createLabelByData: function(data) {
		let span = document.createElement("div");
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
		let labelData = [{
			innerText: "Press any button to start",
			style: "font-size:16px;"
		}, {
			innerText: "Instructions",
			style: "font-size:48px;margin-top:-5px;margin-bottom:3px;"
		}, {
			innerText: "To use the gamepad",
			style: "font-size:16px;"
		}, {
			innerText: "You must first learn to use the",
			style: "font-size:16px;"
		}, {
			innerText: "Are you ready for that?",
			style: "font-size:16px;"
		}, {
			innerText: "You'll do great",
			style: "font-size:16px;"
		}];
		labelData.filter((data,i)=>(i>2)).forEach(data=>data.style += "margin-top:3px");
		this.spans = labelData.map(data => this.createLabelByData(data));
	},
	isShown: function() {
		return (this.spans[0].parentNode === this.primary)
	},
	show: function() {
		if (this.isShown())
			return;
		this.spans.forEach(span => this.primary.appendChild(span));
	},
	hide: function() {
		if (!this.isShown())
			return;
		this.spans.forEach(span => this.primary.removeChild(span));
	},
	setState: function(type, text) {
		let index = ["title", "description"].indexOf(type);
		if (index !== -1 && index < this.spans.length);
			this.spans[index].innerText = text;
	}
}