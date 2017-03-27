var player, gui, world;

let lastTimeStamp = 0;
let leftOver = 0;
let lastLag = false;

function pausedUpdate() {
	if (!game.paused) {
		return update();
	}
	statClick = false;
    let thisTimeStamp = performance.now();
    let difference = thisTimeStamp - lastTimeStamp + leftOver;
	if (difference < 160) {
		gui.stats.delta = difference;
		gui.stats.normalStep();
	} else {
		gui.stats.delta = 160;
		gui.stats.lagStep();
	}
	lastTimeStamp = thisTimeStamp;
    game.render();
    window.requestAnimationFrame(pausedUpdate);
}

function update() {
	if (game.paused) {
		return pausedUpdate();
	}
	statClick = false;
    let thisTimeStamp = performance.now();
    let difference = thisTimeStamp - lastTimeStamp + leftOver;
    leftOver = 0;
    if (difference > 1000) {
    	game.pause();
		gui.showPaused();
    	game.render();
		lastTimeStamp = thisTimeStamp;
    	window.requestAnimationFrame(update);
	}
    if (difference > 160) {
    	if (lastLag) {
        	game.pause();
			gui.showPaused();
        	game.render();
        	return;
    	} else {
    		lastLag = true;
    		difference = 160;
    	}
    }
	gui.stats.delta = difference;
    if (difference > 112) {
		gui.stats.lagStep();
		difference = 16;
	} else {
		gui.stats.normalStep();
	}
	while (difference >= 16) {
		difference -= 16;
		game.update();
	}
	lastTimeStamp = thisTimeStamp;
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
	},
	pause: function() {
		this.gui.stats.delta = 0;
		this.paused = true;
	},
	resume: function() {
		this.gui.stats.delta = 0;
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
		if (gui.state !== "crosshair") {
			this.paused = true;
			pausedUpdate();
		} else
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