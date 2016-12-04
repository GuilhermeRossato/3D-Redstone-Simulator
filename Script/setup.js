var domInterface = document.getElementById("ui");
while(domInterface.firstChild)
	domInterface.removeChild(domInterface.firstChild);
var domMenu = document.createElement("div")
domMenu.className = "menu";
var domSubmenu = document.createElement("div")
domSubmenu.className = "submenu";
domInterface.appendChild(domMenu);
domInterface.appendChild(domSubmenu);
var menu = new Menu(domMenu,domSubmenu);
var logger = new Logger(domInterface);

if (!('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document)) {
	logger.warn("Your browser doesn't support pointer lock API.");
	logger.error("This experiment will not work correctly.");
}

