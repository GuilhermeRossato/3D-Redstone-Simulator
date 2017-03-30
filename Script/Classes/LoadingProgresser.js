function LoadingProgresser(parent, interface, onFinished) {
	this.interface = interface;
	this.parent = parent;
	this.callback = onFinished;
	this.progress = 0;
	this.sync = Settings.performance.syncLoading.value;
	this.delayed = Settings.performance.delayedLoading.value;
	this.begin();
}

LoadingProgresser.prototype = {
	constructor: LoadingProgresser,
	setState: function(id) {
		this.setProgressByState(id);
		this.lastStateChange = performance.now();
		this.state = id;
	},
	processState: function(id) {
		if (id === 0) {
			this.setText("Initializing TextureStitcher");
			this.parent.setupTextureStitcher();
			this.setState(1);
		} else if (id === 1) {
			this.lastStatus = this.parent.textureStitcher.loadStep(this.lastTimeStamp);
			this.setText(this.lastStatus.title + " > " + this.lastStatus.description);
			if (this.lastStatus.percent >= 1) {
				this.setState(2);
			} else {
				this.progress = interpolation.add(0, 0).add(9, 1).at(1 + this.lastStatus.percent);
			}
		} else if (id === 2) {
			this.setText("Initializing Threejs");
			this.interface.setupThreejs();
			this.setState(3);
		} else if (id === 3) {
			this.setText("Initializing Player");
			this.parent.setupPlayer();
			this.setState(4);
		} else if (id === 4) {
			this.setText("Generating Inventory");
			this.interface.setupInventory();
			this.setState(5);
		} else if (id === 5) {
			this.setText("Initializing WorldHandler");
			this.parent.setupWorld();
			this.setState(6);
		} else if (id === 6) {
			this.lastStatus = this.parent.world.loadStep(this.lastTimeStamp);
			this.setText(this.lastStatus.title + " > " + this.lastStatus.description);
			if (this.lastStatus.percent >= 1) {
				this.setState(7);
			} else {
				this.progress = interpolation.add(0, 0).add(9, 1).at(6 + this.lastStatus.percent);
			}
		} else if (id === 7) {
			this.setText("Rendering World");
			this.parent.render();
			this.setState(8);
		} else if (id === 8) {
			this.setText("Getting Ready");
			this.interface.showRenderer();
			this.setState(9);
		}
	},
	setProgressByState: function(id) {
		this.progress = (id === 9) ? 1 : interpolation.add(0, 0).add(9, 1).at(id);
	},
	setText: function(text) {
		this.labels[1].innerText = text;
	},
	setupLabels: function() {
		this.labels = (new Array(...this.interface.main.children)).filter(element=>element instanceof HTMLSpanElement);
		if (this.labels.length < 3) {
			console.log("Silent Loading Activated");
			this.labels = [{}, {}, {}];
		}
	},
	begin: function() {
		this.setupLabels();
		this.lastTimeStamp = performance.now();
		this.setState(0);
		this.step();
	},
	step: function() {
		let thisMS = performance.now();
		this.processState(this.state);
		this.setProgressByState(this.state);
		this.labels[2].innerText = (this.progress * 100 | 0).toString() + "%";
		if (this.progress < 1) {
			if (this.delayed) {
				this.lastMS = thisMS;
				setTimeout(()=>this.step(), 1000);
			} else {
				if (this.sync && this.lastMS !== thisMS) {
					this.lastMS = thisMS;
					this.step();
				} else {
					this.lastMS = thisMS;
					requestAnimationFrame(()=>this.step());
				}
			}
		} else
			this.callback.call(this.parent);
	}
}
