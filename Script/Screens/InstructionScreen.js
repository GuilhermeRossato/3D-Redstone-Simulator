const InstructionScreen = {
/*"Click anywhere to start\nInstructions\n" +
"[W, A, S, D] to move up, left, down, right\n" +
"[Numeric Keys] to change selected block\n" +
"[E, ESC, I] to open inventory\n" +
"[Ctrl + B] to disable collision detection\n
[Ctrl + M] to disable auto-pausing");
	*/
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
	updateSpanText: function() {
		let keys = [Settings.keys.movement.forward.value, Settings.keys.movement.left.value, Settings.keys.movement.backward.value, Settings.keys.movement.right.value];
		keys = keys.map(key => (key.substr(0,3) === "Key")?key.substr(3):key);
		this.spans[2].innerText = `[${keys[0]}, ${keys[1]}, ${keys[2]}, ${keys[3]}] to move forward, left, back, right`;
		keys = Settings.keys.other.inventory.value;
		this.spans[4].innerText = `[${(keys.substr(0,3) === "Key")?keys.substr(3):keys}] to open/close inventory`;
		keys = Settings.keys.other.collision.value;
		this.spans[7].innerText = `[Ctrl + ${(keys.substr(0,3) === "Key")?keys.substr(3):keys}] to toggle collision detection`;
	},
	init: function(domElement) {
		this.primary = document.getElementById("primary");
		if (!this.primary)
			throw "Missing Error: Base element not found (id='primary')";
		let labelData = [{
			innerText: "Click anywhere to start",
			style: "font-size:16px;"
		}, {
			innerText: "Instructions",
			style: "font-size:48px;margin-top:-5px;margin-bottom:3px;"
		}, {
			innerText: "[W, A, S, D] to move forward, left, back, right",
			style: "font-size:16px;"
		}, {
			innerText: "[Numeric Keys] to change selected block",
			style: "font-size:16px;"
		}, {
			innerText: "[E] to open/close inventory",
			style: "font-size:16px;"
		}, {
			innerText: "[ESC] to open/close settings menu",
			style: "font-size:16px;"
		}, {
			innerText: "[H] to open this help menu",
			style: "font-size:16px;"
		}, {
			innerText: "[Ctrl + B] to toggle collision detection",
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
		this.updateSpanText();
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