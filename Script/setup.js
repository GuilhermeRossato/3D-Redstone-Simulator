var input = new InputListener();
var persister = new SettingsPersister();
var interface = new GUI(document.body);
var logger = new Logger(interface.secondary);
var world = new WorldHandler(interface.scene);
// Stimuly for debug:
interface.showCrosshair();
//interface.showInventory();
