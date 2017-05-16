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
    if (difference < 750) {
    	if (difference > 240) {
    		if (lastLag) {
				if (!game.paused)
					game.halt();
				difference = 0;
    		} else {
    			lastLag = true;
    			difference = 160;
    		}
    	} else {
    		lastLag = false;
    	}
    	gui.stats.delta = difference;
		if (difference > 112)
			gui.stats.lagStep();
		else
			gui.stats.normalStep();
		while (difference >= 16) {
			difference -= 16;
			game.player.update();
		}
    } else {
    	if (!game.paused)
    		game.pause();
    	game.player.update();
    }
    game.render();
    window.requestAnimationFrame(update);
}

function Game(input, settings) {
	this.input = input;
	this.gui = new GUI(this);
	gui = this.gui;
	Settings.performance.ignoreExcessiveLag.attach(this, "ignoreLag");
	LoadingProgresser.setDelayed(Settings.performance.delayedLoading.value);
	LoadingProgresser.setGame(this).setGUI(this.gui).begin().then(()=>this.loadingFinished());
}

Game.prototype = {
	constructor: Game,
	halt: function() {
		if (this.ignoreLag)
			return;
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
		this.generateDebugStimuly();
		this.paused = true;
		this.gui.setState("help");
		this.startMainLoop();
	},
	startMainLoop: function() {
		update();
	},
	setupWorld: function() {
		this.world = new WorldHandler(this.gui.scene, this.textureStitcher);
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
	}
}