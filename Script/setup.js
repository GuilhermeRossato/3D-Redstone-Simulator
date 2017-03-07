var menuClick = false;
var interface = new GUI(document.body);
var logger = new Logger(interface.secondary);
options.init();
var world = new WorldHandler(interface.scene);

window.requestAnimationFrame(update);

// Stimuly for debug:
interface.showCrosshair();
//interface.showInventory();

