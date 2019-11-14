const MainMenuScreen = {
	init: function() {
		this.shown = false;
		this.wrapper = document.querySelector(".main-menu");
		this.optionList = document.querySelector(".main-menu .option-list");
		this.buttons = {
			start: document.querySelector(".main-menu .start-simulation"),
			settings: document.querySelector(".main-menu .settings"),
			credits: document.querySelector(".main-menu .credits")
		};
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onSelectionMove = this.onSelectionMove.bind(this);
	},
	onMouseDown(x, y) {

	},
	onSelectionMove(direction) {

	},
	update() {

	},
	show: function() {
		this.wrapper.style.display = "";
	},
	hide: function() {
		this.wrapper.style.display = "none";
	}
}

export default MainMenuScreen;