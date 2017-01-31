var camera, scene, renderer;
var controls, player;
var gui, stats;

function GUI(body) {
	this.gamePaused = true;
	this.body = body;
	this.main = document.getElementById("main");
	this.assert(this.main instanceof HTMLDivElement, "Main div not found");
	this.secondary = document.getElementById("secondary");
	this.stats = new StatsEdited(body);
	this.stats.begin();
	this.preventDefaultBehaviours();
	this.setupThreejs();
	this.setupPlayer();
	this.startLoop();
	this.main.style.color = "#eeeeee";
	this.showHelp();
}

function fullGameTick() {
	gui.player.update();
	world.update(gui.player.controls.player.position);
}

function lightGameTick() {
	gui.player.lightUpdate();
	world.lightUpdate(gui.player.controls.player.position);
}

function update() {
	stats.update();
	menuClick = false;
	var delta = stats.delta;
	if (delta >= 16 * 1) {
		if (delta < 16 * 2) {
			stats.normalStep();
			stats.delta -= 16;
			fullGameTick();
		} else if (delta < 16 * 3) {
			stats.normalStep();
			stats.delta -= 16 * 2;
			lightGameTick();
			fullGameTick();
		} else if (delta < 16 * 4) {
			stats.normalStep();
			stats.delta -= 16 * 3;
			lightGameTick();
			lightGameTick();
			fullGameTick();
		} else if (delta < 16 * 5) {
			stats.lagStep();
			lightGameTick();
			lightGameTick();
		} else {
			stats.lagStep();
			lightGameTick();
			lightGameTick();
			if (!gui.gamePaused && !options.ignoreExcessiveLag) {
				controls.releaseMouse();
				gui.showPaused();
			}
		}
	}
	gui.renderer.render(gui.scene, gui.camera);
	window.requestAnimationFrame(update);
}

GUI.prototype = {
	constructor: GUI,
	addBlocksInWorld: function(scene) {},
	startLoop: function() {
		gui = this;
		stats = this.stats;
		update();
	},
	setupThreejs: function() {
		/* Render Setup */
		this.renderer = new THREE.WebGLRenderer({
			antialias: false,
			alpha: false
		});
		this.renderer.setClearColor(0x999999, 1);
		this.renderer.domElement.style.position = "absolute";
		this.body.appendChild(this.renderer.domElement);
		/* Camera Setup*/
		this.camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.25,options.viewDistance);
		this.resize();
		window.addEventListener('resize', (ev)=>this.resize(ev), false);
		/* Scene Setup */
		this.scene = new THREE.Scene();
		options.lights.placeInto(this.scene);
		/* Blocks Setup */
		this.blocks = new BlockController(this.scene);
		blocks = this.blocks;
		addBlocksInWorld({x:0, z:0});
		/* Definition of global variables */
		renderer = this.renderer;
		scene = this.scene;
		camera = this.camera;
	},
	setupPlayer: function() {
		this.player = new Player(this.scene,this.camera,true);
		this.player.parent = this;
		player = this.player;
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
		this.body.style.cursor = "default";
		this.body.onmousedown = this.body.onmouseup = this.body.onclick = () => {};
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
				this.body.style.backgroundColor = "#ffffff";
				this.body.appendChild(this.fill);
			}
		}
		this.fill.style.backgroundColor = color
	},
	showPaused: function() {
		this.gamePaused = true;
		this.clearInterface();
		this.setFill("rgba(0,0,0,0.3)");
		let str = ("Click anywhere to resume\nGame Paused\n");
		if (!options.ignoreExcessiveLag)
			str += "Involuntary (and frequent) pausing indicates\nthat your computer can't keep up with the\n simulation due to performance problems.\nYou can disable auto-pausing with Ctrl + M.\nAlternatively, decrease the amount of blocks.";
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
		this.body.style.cursor = "pointer";
		this.body.onclick = (ev) => this.onSlowClick(ev);
	},
	onSlowClick: function(mouseEvent) {
		this.assert(this.player, "Missing Component Error: Player not defined");
		this.showCrosshair();
	},
	showHelp: function() {
		this.gamePaused = true;
		this.clearInterface();
		this.setFill("rgba(0,0,0,0.4)");
		let str = ("Click anywhere to start\nInstructions\n" + "[W, A, S, D] to move up, left, down, right\n" + "[Numeric Keys] to change selected block\n" + "[E, ESC, I] to open inventory\n" + "[ F ] to show debug info\n" + "[ H ] show or hide these instructions\n" + "[Left click] Break blocks\n" + "[Right click] Place blocks\n" + "[Wooden axe] is the selection tool\n" + "[ R, Shift+R ] to rotate selection\n" + "[Ctrl + C, Ctrl + V] copy and paste selection\n");
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
		this.body.style.cursor = "pointer";
		this.body.onclick = (event)=>{
			if (!menuClick)
				this.onHelpClick(event)
			else
				menuClick = false;
		}
		this.body.onmousedown = this.body.onmouseup = (event)=>{}
	},
	onHelpClick: function(mouseEvent) {
		this.assert(this.player, "Missing Component Error: Player not defined");
		mouseEvent.preventDefault();
		this.showCrosshair();
	},
	showCrosshair: function() {
		this.gamePaused = false;
		this.clearInterface();
		this.player.requestMouse();
		this.body.onmousedown = (event)=>{
			this.player.onMouseDown(event);
		}
		this.body.onmouseup = (event)=>{
			this.player.onMouseUp(event);
		}
		let img = document.createElement("img");
		img.src = "Images/crosshair.png";
		this.main.appendChild(img);
	},
	showInventory: function() {
		this.gamePaused = true;
		this.clearInterface();
		this.body.onclick = this.body.onmousedown = this.body.onmouseup = (event)=>{}
		if (!this.inventory)
			this.inventory = new Inventory(this.main);
		this.inventory.show();
		this.setFill("rgba(0,0,0,0.5)");
	},
	onInventoryClick: function(ev) {
		this.inventory.onClick(ev)
	},
	preventDefaultBehaviours: function() {
		this.body.style.userSelect = "none";
		this.body.onselectionstart = this.body.ondragstart = function(e) {
			e.preventDefault();
			return false;
		}
	},
	assert: function(cond, message) {
		if (!cond)
			throw message || "Assertation Failed";
	}
}