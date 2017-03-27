var player, gui, world;

let lastTimeStamp = 0;
let leftOver = 0;
let lastLag = false;


function update() {
	statClick = false;
    let thisTimeStamp = performance.now();
    let difference = thisTimeStamp - lastTimeStamp + leftOver;
    lastTimeStamp = thisTimeStamp;
    leftOver = 0;
    if (difference > 750) {
		gui.stats.delta = Math.min(255, difference);
    	difference = 0;
    	if (!game.paused)
    		game.pause();
	} else if (difference > 160) {
		if (lastLag) {
			gui.stats.delta = Math.max(255, difference);
			difference = 0;
			if (!game.paused)
				game.halt();
		} else {
			lastLag = true;
			difference = 160;
			gui.stats.delta = 160;
		}
	} else {
		gui.stats.delta = difference;
	}
	if (difference > 112)
		gui.stats.lagStep();
	else
		gui.stats.normalStep();
	while (difference >= 16) {
		difference -= 16;
		game.update();
	}
	leftOver = difference;
    game.render();
    window.requestAnimationFrame(update);
}

function Game() {
	var persister = new SettingsPersister();
	this.gui = new GUI(this);

	gui = this.gui;

	setTimeout(1000,()=>this.generateDebugStimuly());
	this.loading = new LoadingProgresser(this, this.gui, this.loadingFinished);
}

Game.prototype = {
	constructor: Game,
	update: function() {
		this.player.update();
		if (typeof testWorld === "object" && testWorld.update instanceof Function)
			testWorld.update();
	},
	halt: function() {
		this.paused = true;
		this.gui.setState("halted");
	},
	pause: function() {
		this.paused = true;
		this.gui.setState("paused");
	},
	resume: function() {
		this.paused = false;
	},
	generateDebugStimuly: function() {
		//this.gui.showCrosshair();
		//this.gui.showInventory();
	},
	loadingFinished: function() {
		this.gui.loadingFinished();
		this.startMainLoop();
	},
	startMainLoop: function() {
		this.paused = true;
		//this.gui.setState("help");
		update();
	},
	setupWorld: function() {
		this.world = new WorldHandler(this.gui.scene);
		world = this.world;
	},
	setupPlayer: function() {
		this.player = new Player(this.gui.scene, this.gui.camera, true);
		this.player.parent = this;
		this.player.controls.onRelease = () => {
			this.gui.showInventory();
		}
		player = this.player;
	},
	render: function() {
		this.gui.renderer.render(this.gui.scene, this.camera);
	},
	setupTextureStitcher: function() {
		this.textureStitcher = new TextureStitcher(Settings.performance.textureBatchSize.value);
	}
}