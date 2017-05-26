const LoadingScreen = {
	clearBody: function() {
		let accepted = [HTMLLinkElement, HTMLScriptElement];
		(new Array(...document.body.children)).forEach(obj => {
			if (!accepted.some(type => obj instanceof type))
				document.body.removeChild(obj)
		});
	},
	createPrimaryManually: function() {
		console.log("Created Primary Div Manually");
		this.clearBody();
		document.body.setAttribute("style", "width:100%;height:100%;background-color:#999;margin:0px;padding:0px;overflow:hidden;");

		let primaryParent = document.createElement("div");
		primaryParent.setAttribute("style", "z-index:10;position:absolute;width:100%;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Verdana,Geneva,sans-serif;")

		let primary = document.createElement("div");
		primary.setAttribute("style", "z-index:11;text-align:center;");
		primary.id = "primary";
		primaryParent.appendChild(primary);

		let secondary = document.createElement("div");
		secondary.id = "secondary";
		secondary.setAttribute("style", "z-index:12;position:absolute;top:90%;");
		let secondary_span = document.createElement("span");
		secondary_span.setAttribute("style", "font-size:16px;");
		secondary_span.innerText = "Javascript must be enabled";
		secondary.appendChild(secondary_span);
		primaryParent.appendChild(secondary);

		document.body.appendChild(primaryParent);
		return primary;
	},
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
			this.primary = this.createPrimaryManually();
		if (this.primary.childElementCount === 0) {
			let labelData = [{
				innerText: "Loading",
				style: "font-size:48px;"
			}, {
				innerText: "Initializing HTML elements",
				style: "font-size:12px;margin-top:5px;"
			}, {
				innerText: "5%",
				style: "font-size:12px;margin-top:5px;"
			}]
			this.spans = labelData.map(data => this.createLabelByData(data));
			this.spans.forEach(span => this.primary.appendChild(span));
		} else if (this.primary.childElementCount !== 3) {
			console.warn("Unexpected childElementCount on 'primary' div");
		} else {
			this.spans = this.primary.childNodes;
		}
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
		let index = ["title", "description", "percentage"].indexOf(type);
		if (index !== -1 && index < this.spans.length);
			this.spans[index].innerText = text;
	},
	changeColor: function(color) {
		this.spans.forEach(span => span.style.color = color);
	}
}