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
	logger.error("This experiment will not work correctly.");
	logger.warn("Your browser doesn't support pointer lock API.");
}

var centerMessage = new CenterMessage(domInterface, "Click to start", "[W, A, S, D] to move up, left, down, right\n[Numeric Keys] to change selected block\n[E, ESC, I] to change selected tool (top menu)\n[Ctrl + 1, 2, 3] Also changes the selected tool\n[Ctrl + C, Ctrl + V] copy and paste selection\n[ +, - ] to change tools menu size");
