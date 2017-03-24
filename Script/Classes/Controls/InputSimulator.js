function InputSimulator(frameRetriever) {
	this.type = this.types.load;
	this.getFrame = ()=>{
		return frameRetriever.frame;
	}
	document.addEventListener("keydown", (ev)=>this.onKeyDown(ev));
	document.addEventListener("keyup", (ev)=>this.onKeyUp(ev));
	this.events = [];
	this.events.addKey = function(ev, type) {
		if (this.length > 0)
			this.push({
				keyCode: ev.keyCode,
				type: type,
				code: ev.code,
				timeStamp: ev.timeStamp | 0
			});
	}
	if (this.type == this.types.save) {
		setTimeout(()=>this.putBase(), 10);
	}
}

InputSimulator.prototype = {
	constructor: InputSimulator,
	types: {
		load: 1,
		save: 2,
	},
	putBase: function() {
		this.events.push({x:player.position.x, y:player.position.y, z: player.position.z, yaw:player.rotation.yaw, pitch:player.rotation.pitch});
	},
	onKeyDown: function(ev) {
		if (this.type === this.types.save) {
			if (ev.ctrlKey && ev.code == "KeyI") {
				if (typeof saveAs === "function") {
					let data = JSON.stringify(this.events);
					while (data.indexOf("},{") !== -1)
						data = data.replace("},{", "},\n{");
					var blob = new Blob(data.split(''));
					saveAs(blob, "input.txt", false);
				} else {
					console.warn("Warning: no saving mechanism!");
				}
			} else {
				this.events.addKey(ev, "dn");
			}
		} else if (this.type === this.types.load) {
			if (ev.ctrlKey && ev.code == "KeyI") {
				this.loadEvents();
			}
		}
	},
	onKeyUp: function() {
		if (this.type == this.types.save) {
			this.events.addKey(ev, "up");
		}
	},
	loadFileSelected: function(file) {
		var output = [];
		if (file.size > 100000) {
			logger.log("Cannot load file due to size limit");
			return;
		}
		var fileReader = new FileReader();
		fileReader.onloadend = (e)=>this.handleFileLoaderResult(e.target.result);
		fileReader.readAsText(file);
	},
	handleFileLoaderResult: function(result) {
		this.events = JSON.parse(result);
		if (this.events[0] && this.events[0].x) {
			player.position.set(this.events[0].x, this.events[0].y,this.events[0].z);
			player.rotation.yaw = this.events[0].yaw;
			player.rotation.pitch = this.events[0].pitch;
		} else {
			console.warn("No valid position info");
		}
	},
	loadEvents: function() {
		var input = document.createElement('input');
		input.type = 'file';
		input.name = "file";
		input.addEventListener('change', (ev)=>this.loadFileSelected(event.target.files[0]), false);
		input.click();
	}
}
