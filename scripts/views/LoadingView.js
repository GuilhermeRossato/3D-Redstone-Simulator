define([], {
	load: function() {
		this.content = document.querySelector(".content");
		this.title = this.content.querySelector(".title");
		this.description = this.content.querySelector(".description .text");
		this.percentageLabel = this.content.querySelector(".description .percentage");
		this.percentageBar = this.content.querySelector(".bar .progress");
	},
	setProgress: function(p) {
		this.percentageBar.style.width = (100.5*p).toFixed(2)+"%";
		this.percentageLabel.innerText = (100*p).toFixed(0)+"%";
	},
	open: function () {
		console.log("Loading View Started");
	},
	close: function () {
		console.log("Loading View Closed");
	}
});