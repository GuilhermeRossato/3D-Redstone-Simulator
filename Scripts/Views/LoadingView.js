define([], {
	load: function() {
		this.content = document.querySelector(".content");
		this.title = this.content.querySelector(".title");
		this.description = this.content.querySelector(".description .text");
		this.percentageLabel = this.content.querySelector(".description .percentage");
		this.percentageBar = this.content.querySelector(".bar .progress");
	},
	setProgress: function(p) {
		var percentString = (100*p).toFixed(2)+"%";
		this.percentageBar.style.width = percentString;
		this.percentageLabel.innerText = percentString;
	},
	open: function () {
		console.log("Loading View Started");
	},
	close: function () {
		console.log("Loading View Closed");
	}
});