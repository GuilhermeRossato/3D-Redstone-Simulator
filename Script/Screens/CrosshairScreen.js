const CrosshairScreen = {
	init: function() {
		this.primary = document.getElementById("primary");
		this.wrapper = document.createElement("img");
		this.wrapper.src = "Images/crosshair.png";
	},
	show: function() {
		this.primary.appendChild(this.wrapper);
		return this;
	},
	hide: function() {
		this.primary.removeChild(this.wrapper);
	}
}