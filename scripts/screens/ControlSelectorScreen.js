const ControlSelectorScreen = {
	init: function() {
		this.shown = false;
		this.wrapper = document.querySelector(".control-selector-screen");
		this.optionList = document.querySelector(".control-selector-screen .option-list");
		this.noticeList = document.querySelector(".control-selector-screen .notice-list");
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
		if (ev.button === 0) {
			this.lastEvent = "desktop";
		}
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
			if (this.onSelect && window.innerWidth >= window.innerHeight) {
				this.onSelect(this.lastEvent);
				this.onSelect = undefined;
			}
			this.lastEvent = undefined;
		}
	},
	show: function() {
		if (this.shown)
			return;
		this.shown = true;

		let enabledList, disabledList;

		if (window.innerWidth < window.innerHeight) {
			this.enabledList = this.noticeList;
			this.disabledList = this.optionList;
		} else {
			this.enabledList = this.optionList;
			this.disabledList = this.noticeList;
		}

		this.wrapper.style.display = "";
		this.enabledList.parentNode.classList.add("list-hidden");
		this.disabledList.parentNode.classList.add("list-hidden");

		document.addEventListener("touchstart", this.onTouchStart);
		window.addEventListener("mousedown", this.onMouseDown);
		window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
			this.enabledList.parentNode.classList.remove("list-hidden");
			this.wrapper.style.backgroundColor = "rgba(0,0,0,0.61)";
		}));

		return this;
	},
	resize: function() {
		if (window.innerWidth < window.innerHeight && this.enabledList != this.noticeList) {
			this.enabledList = this.noticeList;
			this.disabledList = this.optionList;
			this.enabledList.parentNode.classList.remove("list-hidden");
			this.disabledList.parentNode.classList.add("list-hidden");
		} else if (window.innerWidth >= window.innerHeight && this.enabledList != this.optionList) {
			this.enabledList = this.optionList;
			this.disabledList = this.noticeList;
			this.enabledList.parentNode.classList.remove("list-hidden");
			this.disabledList.parentNode.classList.add("list-hidden");
		}
	},
	hide: function() {
		if (!this.shown)
			return;
		this.shown = false;
		this.wrapper.style.display = "none";
		document.removeEventListener("touchstart", this.onTouchStart);
		window.removeEventListener("mousedown", this.onMouseDown);
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