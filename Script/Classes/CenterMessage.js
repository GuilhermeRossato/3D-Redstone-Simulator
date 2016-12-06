function CenterMessage(domElement, title, message) {
	var centered = document.createElement("div")
	centered.className = "full";
	var subcentered = document.createElement("div");
	subcentered.className = "first-message"
	centered.appendChild(subcentered);
	var h1 = document.createElement("h1");
	h1.appendChild(document.createTextNode(title));
	subcentered.appendChild(h1);
	var p = document.createElement("p");
	p.innerHTML = this.continuousReplace(message, "\n", "<br>");
	subcentered.appendChild(p);
	domElement.appendChild(centered);
	this.domElement = centered;
	document.addEventListener("pointerlockchange", (ev)=>this.onPointerlockChange.call(this, ev));
}

CenterMessage.prototype = {
	constructor: CenterMessage,
	continuousReplace: function(text, fromReplace, toReplace) {
		var limit = 100;
		while (text.indexOf(fromReplace) && (limit > 0)) {
			text = text.replace(fromReplace, toReplace);
			limit--;
		}
		return text;
	},
	onPointerlockChange: function() {
		if (document.pointerLockElement == document.body) {
			this.domElement.style.display = 'none';
		}
	}
}