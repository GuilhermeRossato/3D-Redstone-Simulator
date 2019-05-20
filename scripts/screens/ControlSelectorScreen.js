const ControlSelectorScreen = {
	init: function(config) {

		this.shown = false;
		this.primary = document.querySelector(".content");
		this.root = this.createElementByData({
			"class": "root",
			style: "z-index:100;position:absolute;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Verdana,Geneva,sans-serif;pointer-events:none;background-color:rgba(0,0,0,0);transition:background-color 0.2s ease-in-out"
		});
		document.body.appendChild(this.root);

		let baseChildStyle = "min-width:20vmax;text-align:center;flex: 1 1 auto; margin:5px;background-color:rgba(99,99,99,0.5);border-radius:2px";
		this.elements = {
			wrapper: this.createElement("div", "color:#DDD;display:flex; align-items:flex-start;align-content:space-around;opacity:0;transition:opacity 0.3s ease-in-out 0.1s,transform 0.4s ease-out;transform:translateY(35px);"),
			keyboard: this.createElement("div", "order:1;"+baseChildStyle,
										 "Desktop", "keyboard mouse", "Left click anywhere to select", 1),
			touchscreen: this.createElement("div", "order:2;"+baseChildStyle,
											"Touchscreen", "touch_app", "Touch anywhere to select", 2),
			gamepad: this.createElement("div", "order:3;"+baseChildStyle,
										"Gamepad", "videogame_asset", "Press any button to select", 3)
		}
		const elementList = [this.elements.keyboard,this.elements.touchscreen,this.elements.gamepad];

		elementList.forEach(element => this.elements.wrapper.appendChild(element));

		this.onTouchStart = this.onTouchStart.bind(this);
		this.onGamepadKey = this.onGamepadKey.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
	},
	onTouchStart: function(ev) {
		this.lastEvent = "touchscreen";
	},
	onGamepadKey: function(btn) {
		this.lastEvent = "gamepad";
	},
	onMouseDown: function(ev) {
		if (ev.button === 0)
			this.lastEvent = "desktop";
	},
	requestFullscreen: function() {
		let elem = this.main;
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.msRequestFullscreen) {
			elem.msRequestFullscreen();
		} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
			elem.webkitRequestFullscreen();
		} else {
			throw new Error("Could not request fullscreen access to the browser");
		}
	},
	checkGamepadEvent: function() {
		let gamepad = navigator.getGamepads()[0];
		if (gamepad && gamepad.buttons) {
			gamepad.buttons.forEach(button => (button.pressed && this.onGamepadKey(button)));
		}
	},
	update: function() {
		this.checkGamepadEvent();
		let index = ["desktop", "touchscreen", "gamepad"].indexOf(this.lastEvent);
		if (index !== -1) {
			if (this.onSelect) {
				this.onSelect(this.lastEvent);
				this.onSelect = undefined;
			}
			this.lastEvent = undefined;
		}
	},
	resize: function(width, height) {
		this.elements.wrapper.style.transform = (width < height)?"rotate(90deg)":"none";
	},
	show: function() {
		if (this.shown)
			return
		this.shown = true;
		this.root.appendChild(this.elements.wrapper);
		this.root.style.cursor = "pointer";
		document.addEventListener("touchstart", this.onTouchStart);
		window.addEventListener("mousedown", this.onMouseDown);
		const wrapper = this.elements.wrapper;
		const rootElement = this.root;
		const resize = this.resize.bind(this);
		window.requestAnimationFrame(function() {
			window.requestAnimationFrame(function() {
				wrapper.style.opacity = "1";
				wrapper.style.transform = "translateY(0px)";
				resize(window.innerWidth, window.innerHeight);
				rootElement.style.backgroundColor = "rgba(0,0,0,0.61)"
			});
		});
		return this;
	},
	hide: function() {
		if (!this.shown)
			return
		this.root.removeChild(this.elements.wrapper);
		this.root.style.cursor = "default";
		this.shown = false;
		this.elements.wrapper.style.opacity = "0";
		this.elements.wrapper.style.transform = "translateY(50px)";
		this.root.style.backgroundColor = "rgba(0,0,0,0)";
		document.removeEventListener("touchstart", this.onTouchStart);
		window.removeEventListener("mousedown", this.onMouseDown);
	},
	fadeOut: function(id) {
		const elements = [this.elements.keyboard, this.elements.touchscreen, this.elements.gamepad];
		elements.forEach((element, i) => ((element.style.transition = (i === id)?"all 1s ease-in":"all 0.5s") && (element.style.opacity = '0')));
	},
	createElement: function(type, style, title, iconText, text, id) {
		const element = document.createElement(type);
		let selement;
		if (style) {
			element.setAttribute("style", style);
		}
		if (title) {
			selement = document.createElement("span");
			selement.setAttribute("style", "display:block;font-size:1.5em; padding:7px;");
			selement.appendChild(document.createTextNode(title));
			element.appendChild(selement);
		}
		if (iconText) {
			selement = document.createElement("div");
			selement.setAttribute("style", "display: flex; width: 100%; align-items: center; justify-content:center; white-space: nowrap;");
			iconText.split(" ").forEach(function(iconName, i, iconList) {
				const sselement = document.createElement("i");
				sselement.setAttribute("class", "material-icons");
				var fontSize = "9em";
				if (iconName === "keyboard") {
					fontSize = "9.2em";
				} else if (iconName === "mouse") {
					fontSize = "5.2em";
				}
				if (iconName === "touch_app") {
					sselement.setAttribute("style", `font-size:${fontSize}; height: 154px; margin-top:-10px;`);
				} else {
					sselement.setAttribute("style", `font-size:${fontSize}; max-height: 144px;`);
				}
				sselement.appendChild(document.createTextNode(iconName));
				selement.appendChild(sselement);
			});
			element.appendChild(selement);
		}
		if (text) {
			selement = document.createElement("span");
			selement.setAttribute("style", "display:block;font-size:0.75em; padding:8px 10px; white-space: nowrap;");
			selement.appendChild(document.createTextNode(text));
			element.appendChild(selement);
		}
		return element;
	},
	createElementByData: function(data) {
		const span = document.createElement(data.tag || 'div');
		for (let property in data) {
			if (property === "innerText") {
				span.innerText = data[property];
			} else if (data.hasOwnProperty(property)) {
				span.setAttribute(property, data[property]);
			}
		}
		return span;
	},
	once: function(eventType, callback) {
		if (eventType === "select") {
			this.onSelect = callback;
		} else {
			throw new Error("Unhandled event \""+eventType+"\"");
		}
	}
}

export default ControlSelectorScreen;