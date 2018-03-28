define(["scripts/Classes/Application.js"], (Application)=>{
	this.app = new Application();
});

var obj;
if (obj = document.querySelector(".footer > .no-script")) {
	obj.style.display = "none";
}