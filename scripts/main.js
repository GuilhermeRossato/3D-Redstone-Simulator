define(["scripts/classes/Application.js"], (Application)=>{
	console.log(this);
	this.app = new Application();
});

var obj;
if (obj = document.querySelector(".footer > .no-script")) {
	obj.style.display = "none";
}