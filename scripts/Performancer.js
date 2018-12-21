/*!
*
* A lighter substitute of mrdoob's Stats Library
*
*/

export default class Performancer {
	constructor(compact=true, zIndex=1) {
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
		this.compactDisplay = !compact;
		wrapper.onclick = () => {
			canvas.style.display = (this.compactDisplay)?"none":"";
			this.compactDisplay = !this.compactDisplay;
			if (this.onCompactChange)
				this.onCompactChange(this.compactDisplay);
		}
		wrapper.onclick();

		this.wrapper = wrapper;
		this.ctx = canvas.getContext("2d");
		this.span = span;
		this.index = 0;
		this.domElement = wrapper;
	}
	reset() {
		this.ctx.clearRect(0, 0, 75, 32);
		index = 0;
	}
	update(delta) {
		let ctx = this.ctx;
		let span = this.span;
		if (this.index < 75)
			this.index++;
		else
			this.index = 0;
		if (this.index % 5 === 0)
			span.innerText = `${delta|0} MS`;
		if (this.compactDisplay) {
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
			ctx.clearRect(this.index, 0, 3, 32);
			ctx.fillRect(this.index, 31-delta, 1, delta+1);
		}
	}
	attach(object) {
		if (this.wrapper.parentNode)
			this.wrapper.parentNode.removeChild(this.wrapper);
		if (object && object.appendChild)
			object.appendChild(this.wrapper);
		else
			console.warn("Unable to append Performancer");
	}
}