const WelcomeScreen = {
	init: function() {
		this.shown = false;
		let primary = document.getElementById("primary");
		this.main = primary.parentElement;
		
		this.elements = {
			wrapper: this.createElement("div", "display:flex; align-items:center; content-align:space-around;background-color:#444;"),
			keyboard: this.createElement("div", "order:1;width:30%;background-color:#555;color:#eee;",
										 "Mouse and Keyboard", "mouse keyboard", "Click anywhere to select"),
			touchscreen: this.createElement("div", "order:2;width:30%;background-color:#555;color:#eee;",
											"Touchscreen", "touch_app", "Touch anywhere to select"),
			gamepad: this.createElement("div", "order:3;width:30%;background-color:#555;color:#eee;",
										"Gamepad", "videogame_asset", "Press any key to select")
		}
		[this.elements.keyboard,this.elements.touchscreen,this.elements.gamepad].forEach(element => this.elements.wrapper.appendChild(element));
	},
	show: function() {
		if (!this.shown)
			return
		this.elements.wrapper.display = "none";
		this.shown = false;
	},
	hide: function() {
		if (this.shown)
			return
		this.elements.wrapper.display = "flex";
		this.shown = false;
	},
	createElement: function(type, style, title, iconText, text) {
		let element = document.createElement(type);
		let selement;
		if (style) {
			element.setAttribute("style",style);
		}
		if (title) {
			selement = document.createElement("span");
			selement.setAttribute("style", "display:block;font-size:2em;");
			selement.appendChild(document.createTextNode(text));
			element.appendChild(selement);
		}
		if (iconText) {
			selement = document.createElement("span");
			selement.setAttribute("style", "display:block;font-size:1em;");
			let sselement = document.createElement("i");
			sselement.setAttribute("class", "material-icons");
			selement.appendChild(document.createTextNode(iconText));
			element.appendChild(selement);
		}
		if (text) {
			selement = document.createElement("span");
			selement.setAttribute("style", "display:block;font-size:1em;");
			selement.appendChild(document.createTextNode(text));
			element.appendChild(subElement);
		}
		return element;
	}
}
	