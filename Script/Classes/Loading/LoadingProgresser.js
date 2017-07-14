/*
 * Module to progress loading of 3D Redstone Simulator
 * Heavily dependant of context.
*/

LoadingProgresser = (function() {
	let watchDog = {
		lastStatusChange: 0,
		getElapsedTime: function(timeStamp) {
			return ( timeStamp - this.lastStatusChange)
		},
		update: function() {
			let timeStamp = performance.now();
			if (this.getElapsedTime(timeStamp) > 7000) {
				(!this.showErrorB) && (this.showErrorB = true) && showWatchDogFatalError();
				this.halt();
			} else if (this.getElapsedTime(timeStamp) > 4000) {
				(!this.showErrorA) && (this.showErrorA = true) && showWatchDogError();
			}
		},
		halt: function() {
			clearInterval(this.timer);
		},
		start: function(timeStamp) {
			this.lastStatusChange = timeStamp;
			this.timer = setInterval(()=>this.update(), 1000);
		},
		statusChange: function(timeStamp) {
			this.lastStatusChange = timeStamp;
		}
	}
	let game, gui, delayed, state, progress, lastStatusText, lastProgressText, onFinishedCallback;
	function setState(id) {
		if (state !== id) {
			watchDog.statusChange(performance.now());
			state = id;
		}
	}
	function setText(text) {
		LoadingScreen.setState("description", text);
	}
	function setTextByStatus(status) {
		if (lastStatusText === status)
			return
		lastStatusText = status;
		setText(status.title + " > " + status.description);
	}
	function setStateByStatus(status, startId) {
		setState((status.progress >= 1) ? startId + 1 : startId + status.progress);
	}
	function showErrorStatus(status) {
		LoadingScreen.setState("title", "Fatal Error")
		LoadingScreen.setState("description", status.owner);
		LoadingScreen.setState("percentage", status.description);
		console.log(status.debug);
	}
	function showWatchDogError() {
		//LoadingScreen.setState("title", "WatchDog Intervention")
		LoadingScreen.setState("description", "This is taking too long...");
		//LoadingScreen.setState("percentage", "This shouldn't happen unless you have a slow network.");
		console.log("state: ",state,"  lastStatusChange: ", watchDog.lastStatusChange);
	}
	function showWatchDogFatalError() {
		LoadingScreen.setState("title", "WatchDog Intervention")
		LoadingScreen.setState("description", "An unhandled exception must have stopped the LoadingProgresser.");
		LoadingScreen.setState("percentage", "Please, send this to the developer: \"Error State: " + state + "\"");
		console.log("state: ",state,"  lastStatusChange: ", watchDog.lastStatusChange);
	}
	function processStatusState(status, id) {
		if (status instanceof ErrorStatus) {
			showErrorStatus(lastStatus);
			watchDog.halt();
		} else if (status instanceof LoadStatus) {
			setTextByStatus(status);
			setStateByStatus(status, id);
		} else {
			throw "Wrong Object: Expected LoadStatus or ErrorStatus";
		}
	}
	function processState(id) {
		if (id === 0) {
			setText("Initializing Graphical User Interface");
			(gui.loadBegin && gui.loadBegin());
			let screenList = [
				DesktopInstructionScreen,
				MobileInstructionScreen,
				GamepadInstructionScreen,
				InventoryScreen,
				MenuScreen,
				MessageScreen,
				WelcomeScreen
			];
			screenList.forEach(screen => screen.init.call(screen, gui));
			setState(1);
		} else if (id === 1) {
			let lastStatus = gui.loadStep();
			processStatusState(lastStatus, 1);
			if (state === 2 && gui.loadEnd)
				gui.loadEnd();
		} else if (id === 2) {
			setText("World > Setting up World");
			game.setupWorld();
			game.setupPlayer();
			game.world.loadBegin();
			setState(3);
		} else if (id === 3) {
			let lastStatus = world.loadStep();
			processStatusState(lastStatus, 3);
			if (state === 4 && world.loadEnd)
				world.loadEnd();
		} else if (id === 4) {
			setText("GUI > Rendering World");
			game.render();
			setState(5);
		} else if (id === 5) {
			gui.showRenderer();
			game.render();
			setState(6);
			setText("GUI > Loading Input Menu");
		}
	}
	function updateProgress(id) {
		progress = Math.max(0, Math.min(1, interpolation.add(0, 0).add(6, 1).at(id)));
		if (lastProgressText === progress)
			return
		lastProgressText = progress;
		LoadingScreen.setState("percentage", `${progress * 100 | 0}%`);
	}
	function step() {
		let timeStamp = performance.now();
		processState(state | 0);
		updateProgress(state);
		if (progress < 1) {
			if (delayed) {
				setTimeout(step, 1500);
			} else {
				setTimeout(step, 1);
			}
		} else if (progress >= 1) {
			watchDog.halt();
			(onFinishedCallback instanceof Function) && onFinishedCallback();
		} else {
			console.error("State is ",this.state);
			debugger;
		}
	}
	return {
		setDelayed: function(value) {
			delayed = value;
			return this;
		},
		setGUI: function(obj) {
			gui = obj;
			return this;
		},
		setGame: function(obj) {
			game = obj;
			return this;
		},
		begin: function() {
			if (typeof LoadingScreen !== "object")
				throw "Missing Component Error: Loading Screen not defined";
			watchDog.start(performance.now());
			LoadingScreen.init();
			LoadingScreen.show();
			setState(0);
			delete this.begin;
			setTimeout(step, 1);
			return this;
		},
		then: function(func) {
			onFinishedCallback = func;
		}
	}
})();
