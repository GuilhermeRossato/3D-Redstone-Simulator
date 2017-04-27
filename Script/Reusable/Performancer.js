/*!
*
* A lighter substitute of mrdoob's Stats Library
*
* @name Performancer
* @type Class
* @author Guilherme Rossato
*
*/

function Performancer(compact = false, zIndex = 0) {
	/* Document Elements */
	let wrapper = document.createElement("div");
	let span = document.createElement("span");
	let canvas = document.createElement("canvas");
	/* Styles */
	let alignment = "left:0px; top:0px";
	wrapper.setAttribute("style", `cursor:pointer;${alignment};${(zIndex?"z-index: "+zIndex+";":"")}position:absolute; margin:0px; padding:0px; background-color:#020;`);
	canvas.width = 75;
	canvas.height = 32;
	canvas.setAttribute("style", `display:${compact?"inline":"none"};width: ${canvas.width}px; height: ${canvas.height}px; background-color:#003300; margin: 1px 4px 0 4px; padding: 0;`);
	span.setAttribute("style", `color: #00FF00; height:11px; text-align:center; display:block; width: ${canvas.width}px; font-size: 11px; font-family: Verdana, Arial; padding: 0; margin: 0px 4px 3px 4px;`);
	span.innerText = "STARTING";
	/* Appends */
	wrapper.appendChild(span);
	wrapper.appendChild(canvas);
	/* Events */
	let compactDisplay = !compact;
	wrapper.onclick = () => {
		canvas.style.display = (compactDisplay)?"none":"";
		compactDisplay = !compactDisplay;
		if (this.onCompactChange)
			this.onCompactChange(compactDisplay);
	}

	let ctx = canvas.getContext("2d");
	let index = 0;

	this.reset = function() {
		ctx.clearRect(0, 0, 75, 32);
		index = 0;
	}

	this.update = function(delta) {
		if (index < 75)
			index++;
		else
			index = 0;
		if (index % 5 === 0)
			span.innerText = `${delta|0} MS`;
		if (compactDisplay) {
			delta = Math.min(delta/8, 32)|0;
			if (delta < 8) {
				ctx.fillStyle = "#00DB00";
			} else if (delta < 16) {
				ctx.fillStyle = "#DBDB00";
			} else if (delta < 32) {
				ctx.fillStyle = "#DB0000";
			} else {
				ctx.fillStyle = "#000000";
				delta = 32;
			}
			ctx.clearRect(index, 0, 3, 32);
			ctx.fillRect(index, 31-delta, 1, delta+1);
		}
	}

	this.attach = function(object) {
		if (wrapper.parentNode)
			wrapper.parentNode.removeChild(wrapper);
		if (object && object.appendChild)
			object.appendChild(wrapper);
		else
			console.warn("Unable to append Performancer");
	}

	this.domElement = wrapper;
}

Performancer.prototype = {
	constructor: Performancer
}