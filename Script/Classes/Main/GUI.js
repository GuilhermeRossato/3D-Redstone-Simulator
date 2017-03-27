var camera, scene, renderer;
var logger, inventory;

function GUI(parent) {
	this.parent = parent;
	this.gamePaused = true;
	this.main = document.getElementById("main");
	if (!(this.main instanceof HTMLDivElement)) {
		console.log("Creating main div manually");
		if (this.main !== undefined && this.main.parentElement && this.main.parentElement.removeChild)
			this.main.parentElement.removeChild(this.main);
		var outter = document.createElement("div");
		outter.style.zIndex = 10;
		outter.style.position = "absolute";
		outter.style.width = "100%";
		outter.style.height = "100%";
		outter.style.display = "flex";
		outter.style.alignItems = "center";
		outter.style.justifyContent = "center";
		outter.style.fontFamily = "Verdana";
		outter.style.color = "#333333";
		this.main = document.createElement("div");
		this.main.style.zIndex = "11";
		this.main.style.textAlign = "center";
	}
	this.secondary = document.getElementById("secondary");
	this.stats = new StatsEdited(document.body);
	this.stats.begin();
	this.preventDefaultBehaviours();
	this.logger = new Logger(this.secondary);
	logger = this.logger;
}

GUI.prototype = {
	constructor: GUI,
	setupInventory: function() {
		this.inventory = new Inventory(this.main);
		this.inventory.onItemSwitch = (a, b) => { this.onItemSwitch.call(this, a, b) };
		this.hotbar = new Hotbar(this.inventory,this.main);
		this.hotbar.onItemChange = (a, b) => { this.onItemChange.call(this, a, b) };
		Settings.keys.other.inventory.attachEvent("keydown",(event) => this.onInventoryKeyDown());
		Settings.keys.other.debug.attachEvent("keydown",(event) => this.onDebugKeyDown());
		inventory = this.inventory;
		document.addEventListener("mouseup", (ev)=>this.onMouseUp(ev));
		document.addEventListener("mousedown", (ev)=>this.onMouseDown(ev));
	},
	loadingFinished: function() {
		this.showHelp();
	},
	onMouseDown: function(event) {
		if (this.state === "crosshair") {
			this.parent.player.onMouseDown(event);
		} else if (this.state === "pause" || this.state === "halt" || this.state === "help") {
			if (typeof statClick === "undefined" || !statClick) {
				this.showCrosshair();
			}
		}
	},
	onMouseUp: function(event) {
		if (this.state === "crosshair") {
			this.parent.player.onMouseUp(event);
		}
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
	onInventoryKeyDown: function(down) {
		if (this.gamePaused) {
			this.showCrosshair();
		} else {
			this.showInventory();
		}
	},
	onDebugKeyDown: function() {
		this.parent.player.releaseMouse();
		setTimeout(()=>this.showCrosshair(true), 10);
	},
	setupThreejs: function() {
		/* Render Setup */
		this.renderer = new THREE.WebGLRenderer({
			antialias: options.antialias,
			alpha: false
		});
		this.renderer.setClearColor(0x333333, 1);
		this.renderer.domElement.style.position = "absolute";
		this.renderer.domElement.style.display = "none";
		document.body.appendChild(this.renderer.domElement);
		/* Camera Setup*/
		this.camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.2,options.viewDistance);
		Settings.camera.fov.attach(this.camera, "fov");
		this.parent.camera = this.camera;
		window.addEventListener('resize', (ev)=>this.resize(ev), false);
		/* Scene Setup */
		this.scene = new THREE.Scene();
		options.lights.placeInto(this.scene);
		/* Definition of global variables */
		renderer = this.renderer;
		scene = this.scene;
		camera = this.camera;
	},
	showRenderer: function() {
		this.renderer.domElement.style.display = "";
		this.resize();
	},
	onInventoryClick: function(ev) {
		this.inventory.onClick(ev)
	},
	resize: function() {
		if (this.camera) {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
		}
		if (this.renderer) {
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		}
	},
	clearInterface: function() {
		while (this.main.firstChild)
			this.main.removeChild(this.main.firstChild);
		if (this.secondary instanceof HTMLDivElement)
			while (this.secondary.firstChild)
				this.secondary.removeChild(this.secondary.firstChild);
		document.body.style.cursor = "default";
		this.state = "none";
		if (this.fill)
			this.fill.style.backgroundColor = "transparent";
		if (typeof logger === "object")
			this.secondary.appendChild(logger.domElement);
	},
	setFill: function(color) {
		if (!this.fill) {
			this.fill = document.createElement("div");
			this.fill.style.position = "absolute";
			this.fill.style.width = "100%";
			this.fill.style.height = "100%";
			this.fill.style.zIndex = "5";
			let fillActive = true;
			if (fillActive) {
				document.body.style.backgroundColor = "#ffffff";
				document.body.appendChild(this.fill);
			}
		}
		this.fill.style.backgroundColor = color
	},
	showPaused: function() {
		this.clearInterface();
		this.state = "paused";
		this.gamePaused = true;
		this.setFill("rgba(0,0,0,0.3)");
		let str = "Click anywhere to resume\nGame Paused\n";
		if (!options.ignoreExcessiveLag)
			str += "Involuntary (and frequent) pausing indicates\nthat your computer can't keep up with the\n simulation due to performance problems.\nYou can disable auto-pausing with Ctrl + M.\nAlternatively, decrease the amount of blocks in your simulation.\n";
		str.split("\n").forEach((text,i)=>{
			let span = document.createElement("span");
			span.style.display = "block";
			span.style.fontWeight = (i === 0) ? "bold" : "normal";
			span.style.fontSize = (i === 1) ? "48px" : "16px";
			span.style.marginBottom = (i === 1) ? "10px" : "0px";
			span.style.textAlign = (i < 2) ? "center" : "left";
			span.innerText = text;
			this.main.appendChild(span);
		}
		);
		document.body.style.cursor = "pointer";
	},
	showHelp: function() {
		this.clearInterface();
		this.state = "help";
		this.gamePaused = true;
		this.setFill("rgba(0,0,0,0.4)");
		let str = ("Click anywhere to start\nInstructions\n" + "[W, A, S, D] to move up, left, down, right\n" + "[Numeric Keys] to change selected block\n" + "[E, ESC, I] to open inventory\n" + "[Ctrl + B] to disable collision detection\n [Ctrl + M] to disable auto-pausing");
		str.split("\n").forEach((text,i)=>{
			let span = document.createElement("span");
			span.style.display = "block";
			span.style.fontWeight = (i === 0) ? "bold" : "normal";
			span.style.fontSize = (i === 1) ? "48px" : "16px";
			span.style.marginBottom = (i === 1) ? "10px" : "0px";
			span.style.textAlign = (i < 2) ? "center" : "left";
			span.innerText = text;
			this.main.appendChild(span);
		}
		);
		document.body.style.cursor = "pointer";
	},
	showCrosshair: function(ignoreRequest) {
		this.state = "crosshair";
		this.gamePaused = false;
		if (this.inventory.isShown()) {
			this.inventory.hide();
		}
		this.clearInterface();
		if (!ignoreRequest)
			this.parent.player.requestMouse();
		let img = document.createElement("img");
		img.src = "Images/crosshair.png";
		this.main.appendChild(img);
		this.hotbar.show();
		this.parent.resume();
	},
	showInventory: function() {
		this.state = "inventory";
		this.gamePaused = true;
		this.clearInterface();
		this.parent.player.releaseMouse();
		this.inventory.show();
		this.setFill("rgba(0,0,0,0.5)");
	},
	preventDefaultBehaviours: function() {
		document.body.style.userSelect = "none";
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
