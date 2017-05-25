const WelcomeScreen = {
	init: function(gui) {
		this.parent = gui;
		this.shown = false;
		let primary = document.getElementById("primary");
		let baseChildStyle = "min-width:20vmax;text-align:center;flex: 1 1 auto; margin:5px; background-color:rgba(99,99,99,0.5);";
		this.elements = {
			wrapper: this.createElement("div", "color:#DDD; display:flex; align-items:flex-start;align-content: space-around;"),
			keyboard: this.createElement("div", "order:1;"+baseChildStyle,
										 "Desktop", "keyboard mouse", "Click anywhere to select", 1),
			touchscreen: this.createElement("div", "order:2;"+baseChildStyle,
											"Touchscreen", "touch_app", "Touch anywhere to select", 2),
			gamepad: this.createElement("div", "order:3;"+baseChildStyle,
										"Gamepad", "videogame_asset", "Press any button to select", 3)
		}
		this.main = primary.parentElement;
		[this.elements.keyboard,this.elements.touchscreen,this.elements.gamepad].forEach(element => this.elements.wrapper.appendChild(element));

		let self = this;
		this.checkEvents = {
			onTouchStart: function() {
				logger.log("Trying First");
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
					logger.log("Failed miserably");
				}
				self.lastEvent = "touchscreen";
			},
			onGamepadKey: function() {
				self.lastEvent = "gamepad";
			},
			onMouseDown: function() {
				self.lastEvent = "desktop";
			},
			onKeyDown: function() {
				self.lastEvent = "desktop";
			}
		}
	},
	checkForGampadEvent: function() {
		let gamepad = navigator.getGamepads()[0];
		if (gamepad && gamepad.buttons) {
			gamepad.buttons.forEach(button => (button.pressed && this.checkEvents.onGamepadKey(button)));
		}
	},
	update: function() {
		if (this.fading) {
			let timeStamp = performance.now();
			if (timeStamp - this.fadedTimeStamp > 1000) {
				this.fading = false;
				this.parent.inputType = this.nextGuiState;
				
				this.parent.setState(this.nextGuiState);
			}
		} else {
			this.checkForGampadEvent();
			let index = ["desktop", "touchscreen", "gamepad"].indexOf(this.lastEvent);
			if (index !== -1) {
				this.fading = true;
				this.fadeOut(index);
				this.fadedTimeStamp = performance.now();
				this.nextGuiState = this.lastEvent;
			}
		}
	},
	resize: function() {
		this.elements.wrapper.style.rotate = (window.innerWidth < window.innerHeight)?"90deg":"none";
	},
	show: function() {
		if (this.shown)
			return
		this.resize();
		this.main.appendChild(this.elements.wrapper);
		this.main.style.cursor = "pointer";
		this.shown = true;
		document.addEventListener("touchstart", this.checkEvents.onTouchStart);
		document.addEventListener("mousedown", this.checkEvents.onMouseDown);
		document.addEventListener("keydown", this.checkEvents.onKeyDown);
		logger.log("started v1");
		return this;
	},
	hide: function() {
		if (!this.shown)
			return
		this.main.removeChild(this.elements.wrapper);
		this.main.style.cursor = "default";
		this.shown = false;
		document.removeEventListener("touchstart", this.checkEvents.onTouchStart);
		document.removeEventListener("mousedown", this.checkEvents.onMouseDown);
		document.removeEventListener("keydown", this.checkEvents.onKeyDown);
	},
	fadeOut: function(id) {
		let elements = [this.elements.keyboard, this.elements.touchscreen, this.elements.gamepad];
		elements.forEach((element, i) => ((element.style.transition = (i === id)?"all 1s ease-in":"all 0.5s") && (element.style.opacity = '0')));
	},
	createElement: function(type, style, title, iconText, text, id) {
		let element = document.createElement(type);
		let selement;
		if (style) {
			element.setAttribute("style",style);
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
			//let iconList = iconText.split(" ");
			iconText.split(" ").forEach(function(iconName, i, iconList) {
				let sselement = document.createElement("i");
				sselement.setAttribute("class", "material-icons");
				if (iconList.length > 1 && i == 0) {
					sselement.setAttribute("style", "font-size:9.2em;");
				} else if (iconList.length > 1 && i == 1) {
					sselement.setAttribute("style", "font-size:5.2em;");
				} else {
					sselement.setAttribute("style", "font-size:9em;");
				}
				sselement.appendChild(document.createTextNode(iconName));
				selement.appendChild(sselement);
			});
			element.appendChild(selement);
		}
		if (text) {
			selement = document.createElement("span");
			selement.setAttribute("style", "display:block;font-size:0.75em; padding:8px 4px; white-space: nowrap;");
			selement.appendChild(document.createTextNode(text));
			element.appendChild(selement);
		}
		return element;
	}
}