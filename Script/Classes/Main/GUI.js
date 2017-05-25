var camera, scene, renderer;
var logger, inventory;

function GUI(parent, input) {
	this.performancer = new Performancer(Settings.performance.compactPerformancer.value, 20);
	this.performancer.onCompactChange = function(value) {
		Settings.performance.compactPerformancer.value = value;
	}
	this.input = input;
	this.parent = parent;
	this.activeScreen = undefined;
	this.inputType = "desktop";
}

GUI.prototype = {
	constructor: GUI,
	loadBegin: function() {
		this.primary = document.getElementById("primary");
		this.secondary = document.getElementById("secondary");
		this.main = this.primary.parentNode;
		(!this.primary || !this.secondary) && console.warn("Primary and Secondary element should already exist!");
		this.loadCount = 0;

		this.input.attachEventToObject(this.main, "mousedown", ()=>this.onMouseDown.call(this));
		this.input.attachEventToObject(this.main, "mousemove", ()=>this.onMouseMove.call(this));
		this.input.attachEventToObject(this.main, "mouseup", ()=>this.onMouseUp.call(this));
	},
	loadStep: function() {
		if (this.loadCount === 0) {
			this.loadCount = 1;
			this.preventDefaultBehaviours();
			this.logger = new Logger(this.secondary);
			this.primary = document.getElementById("primary");
			this.secondary = document.getElementById("secondary");
			logger = this.logger;
			this.performancer.attach(document.body);
			return new LoadStatus("Graphical User Interface", "three.js Setup", 0.5);
		} else if (this.loadCount === 1) {
			this.loadCount = 2;
			if (this.setupThreejs()) {
				return new LoadStatus("Graphical User Interface", "Adding Events", 1);
			} else {
				return new LoadStatus("Graphical User Interface", "Error: Unable to initialize renderer", 0);
			}
		}
	},
	onMouseDown: function(event) {
		if (this.state === "help" || this.state === "inventory")
			this.setState("crosshair");
		else if (this.state === "crosshair") {
			this.parent.player.onMouseDown(event);
		} else if (this.state === "inventory") {
			this.inventory.onMouseDown(event);
		} else if (this.state === "paused" || this.state === "halted" || this.state === "help") {
			if (typeof statClick === "undefined" || !statClick) {
				this.setState("crosshair");
			}
		}
	},
	onMouseMove: function(event) {
	},
	onMouseUp: function(event) {
	},
	onTouchDown: function() {
	},
	onTouchMove: function() {
	},
	onTouchUp: function() {
	},
	onItemSwitch: function(before, after) {
		let data;
		if (before.position === this.hotbar.selection) {
			data = itensData[before.id];
			if (data && ItemFunctions[data.name] && ItemFunctions[data.name].onDeselected)
				ItemFunctions[data.name].onDeselected();
		}
		if (after.position === this.hotbar.selection) {
			data = itensData[after.id];
			if (data && ItemFunctions[data.name] && ItemFunctions[data.name].onSelected)
				ItemFunctions[data.name].onSelected();
		}
	},
	onItemChange: function(before, after) {
		let data;
		if (before.position === this.hotbar.selection) {
			data = itensData[before.id];
			if (data && ItemFunctions[data.name] && ItemFunctions[data.name].onDeselected)
				ItemFunctions[data.name].onDeselected();
		}
		if (before.position === this.hotbar.selection) {
			data = itensData[after.id];
			if (data && ItemFunctions[data.name] && ItemFunctions[data.name].onSelected)
				ItemFunctions[data.name].onSelected();
		}
	},
	update: function() {
		if (this.activeScreen && this.activeScreen.update) {
			this.activeScreen.update();
		}
	},
	setState: function(state) {
		this.state = state;
		if (state === "inventory")
			this.showInventory();
		else if (state === "crosshair")
			this.showCrosshair();
		else if (state === "halted")
			this.showHalted();
		else if (state === "paused")
			this.showPaused();
		else if (state === "desktop")
			this.showInstructions(0);
		else if (state === "touchscreen")
			this.showInstructions(1);
		else if (state === "gamepad")
			this.showInstructions(2);
		else if (state === "welcome")
			this.showWelcome();
		else
			console.warn("Invalid State!");
	},
	onKeyDown: function() {

	},
	onKeyUp: function() {

	},
	onInventoryKeyDown: function(down) {
		if (this.state === "inventory") {
			this.parent.paused = false;
			this.setState("crosshair");
		} else if (this.state === "crosshair" || this.state === "paused") {
			this.setState("inventory");
			this.parent.paused = true;
		}
	},
	onDebugKeyDown: function() {
		this.parent.player.releaseMouse();
		setTimeout(()=>{this.state = "crosshair"; this.showCrosshair(true)}, 10);
	},
	setupThreejs: function() {
		/* Render Setup */
		try {
			this.renderer = new THREE.WebGLRenderer({
				antialias: options.antialias,
				alpha: false
			});
		} catch (err) {
			return false;
		}
		this.renderer.setClearColor(0x333333, 1);
		this.renderer.domElement.style.position = "absolute";
		this.renderer.domElement.style.display = "none";
		document.body.appendChild(this.renderer.domElement);
		this.canvas = this.renderer.domElement;
		/* Camera Setup*/
		this.camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.2,options.viewDistance);
		Settings.camera.fov.attach(this.camera, "fov");
		this.parent.camera = this.camera;
		addEventListener('resize', (ev)=>this.resize(ev), false);
		/* Scene and Light Setup */
		scene = new THREE.Scene();
		function addLight(name, position, intensity) {
			let light = new THREE.DirectionalLight(0xffffff, intensity);
			light.position.copy(position);
			light.name = name;
			scene.add(light);
		}
		addLight("Top", { x: 0, y: 1, z: 0 }, 2.935);
		addLight("Front", { x: 0, y: 0, z: -1 }, 2.382);
		addLight("Back", { x: 0, y: 0, z: 1 }, 2.3548);
		addLight("Left", { x: -1, y: 0, z: 0 }, 1.7764);
		addLight("Right", { x: 1, y: 0, z: 0 }, 1.7742);
		addLight("Bottom", { x: 0, y: -1, z: 0 }, 1.5161);
		this.scene = scene;
		/* Definition of global variables */
		renderer = this.renderer;
		scene = this.scene;
		camera = this.camera;
		return true;
	},
	showRenderer: function() {
		this.renderer.domElement.style.display = "";
		this.resize();
	},
	resize: function() {
		if (this.camera) {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
		}
		if (this.renderer) {
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		}
		if (this.activeScreen && this.activeScreen.resize) {
			this.activeScreen.resize();
		}
	},
	clearInterface: function() {
		if (this.activeScreen) {
			this.activeScreen.hide()
		} else {
			while (this.primary.firstChild)
				this.primary.removeChild(this.primary.firstChild);
			if (this.secondary instanceof HTMLDivElement)
				while (this.secondary.firstChild)
					this.secondary.removeChild(this.secondary.firstChild);
			this.setFill("transparent");
		}
		if (typeof logger === "object")
			this.secondary.appendChild(logger.domElement);
	},
	setFill: function(color) {
		this.main.style.backgroundColor = color;
	},
	showPaused: function() {
		this.clearInterface();
		MessageScreen.setAttributes([{
			innerText: "Click anywhere to resume",
			style: "font-size:12px;"
		}, {
			innerText: "Game Paused",
			style: "font-size:48px;"
		}]);
		MessageScreen.show();
		this.setFill("rgba(0,0,0,0.4)");
	},
	showHalted: function() {
		this.clearInterface();
		MessageScreen.setAttributes({
			innerText: "Click anywhere to resume",
			style: "font-size:12px;"
		}, {
			innerText: "Game Halted",
			style: "font-size:48px;"
		}, {
			innerText: "It seems that your computer can't keep up with",
			style: "font-size:12px;background-color:red;"
		}, {
			innerText: "with the simulation due to performance problems.",
			style: "font-size:12px;"
		});
		MessageScreen.show();
		this.setFill("rgba(0,0,0,0.4)");
	},
	showInstructions: function(id) {
		this.clearInterface();
		if (id === 0) {
			this.inputType = "desktop";
			this.activeScreen = DesktopInstructionScreen.show();
		} else if (id === 1) {
			this.inputType = "touchscreen";
			this.activeScreen = MobileInstructionScreen.show();
		} else if (id === 2) {
			this.inputType = "gamepad";
			this.activeScreen = GamepadInstructionScreen.show();
		}
		this.setFill("rgba(0,0,0,0.4)");
	},
	showCrosshair: function(ignoreRequest) {
		this.clearInterface();
		if (!ignoreRequest)
			this.parent.player.requestMouse();
		this.activeScreen = CrosshairScreen.show();
		this.parent.resume();
	},
	showInventory: function() {
		this.clearInterface();
		this.parent.pause();
		this.activeScreen = InventoryScreen.show();
		this.setFill("rgba(0,0,0,0.65)");
	},
	showWelcome: function() {
		this.clearInterface();
		this.parent.pause();
		this.activeScreen = WelcomeScreen.show();
		this.setFill("rgba(0,0,0,0.65)");
	},
	preventDefaultBehaviours: function() {
		document.body.onselectionstart = document.body.ondragstart = function(e) {
			e.preventDefault();
			return false;
		}
	},
	assert: function(cond, message) {
		if (!cond)
			throw message || "Assertation Failed";
	}
}
