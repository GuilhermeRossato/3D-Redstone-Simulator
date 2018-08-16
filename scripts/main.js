define(["scripts/classes/Application.js"], (Application)=>{
	console.log(this);
	this.app = new Application();
});

(function clear_javascript_required_text() {
	var obj;
	if (obj = document.querySelector(".footer > .no-script")) {
		obj.style.display = "none";
	}
})();

setTimeout(function loading_watchdog() {
	var loading_span = document.querySelector(".content > .description > .text");
	if (loading_span.innerText === "Downloading javascript files") {
		loading_span.innerHTML = "Something went wrong while loading the app.<br>Please contact support.";
		loading_span.style.textAlign = "center";
		loading_span.style.width = "100%";
		try {
			document.querySelector(".content > .description > .percentage").style.display = "none";
		} catch (e) {}
		try {
			document.querySelector(".content > .bar").style.display = "none";
		} catch (e) {}
	}
}, 1000);