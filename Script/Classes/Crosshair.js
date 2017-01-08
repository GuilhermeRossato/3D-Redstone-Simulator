function Crosshair(domElement) {
	var centered = document.createElement("div")
	centered.className = "cross-full";
	var subcentered = document.createElement("div");
	subcentered.className = "cross-mid"
	centered.appendChild(subcentered);
	var img = document.createElement("img");
	img.src = "Images/crosshair.png";
	subcentered.appendChild(img);
	domElement.appendChild(centered);
	this.domElement = centered;
}

Crosshair.prototype = {
	constructor: Crosshair
}