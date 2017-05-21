function WorldLoader(world) {
	this.world = world;
	document.addEventListener('keydown', (event)=>this.onKeyDown(event, event.code, event.ctrlKey), false);
}

WorldLoader.prototype = {
	constructor: WorldLoader,
	onKeyDown: function(event, code, ctrlKey) {
		if (window.File && window.FileReader && window.FileList && window.Blob) {
			if (ctrlKey && code === Settings.keys.file.load.value) {
				this.loadFromDialog();
				event.preventDefault();
			}
		} else {
			logger.log("Error: Browser doesn't have file support");
		}
	},
	loadFileSelected: function(file) {
		var output = [];
		if (file.size > 100000)
			logger.log("Cannot load file due to size limit");
		else if (file.size > 70000)
			logger.warn("Warning: This file is approaching the file size limit!");
		var fileReader = new FileReader();
		fileReader.onloadend = (e) => this.handleFileLoaderResult(e.target.result);
		fileReader.readAsText(file);
	},
	handleFileLoaderResult: function(result) {
		result = result.split('').map(letter => letter.charCodeAt());
		this.decideFileTypeByData(new Uint8Array(result));
	},
	loadFromDialog: function() {
		var input = document.createElement('input');
		input.type = 'file';
		input.name = "file";
		input.addEventListener('change', (ev) => this.loadFileSelected(event.target.files[0]), false);
		input.click();
	},
	loadFromUrl: function(path, callback) {
		var input = document.createElement('input');
			input.type = 'file';
		input.click();
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = () => {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
			   callback.call(xhttp);
			} else if (xhttp.status === 404)
				this.errorLoading("file not found");
		};
		xhttp.open("GET", path, true);
		xhttp.send();
	},
	decideFileTypeByData: function(data) {
		let type = data.substr(0,10);
		if (type === "mcworld-js") {
			return this.readNormal(data)
		} else if (type === "mcworld-mi" && data[13] === 115) {
			return this.readCompressed(data);
		} else {
			this.errorLoading("incorrect syntax");
		}
	},
	readNormal: function(data) {
		let i = 10; // Start point
		let blockLimit = 20000;
		let blocks = [];
		let mode = "fast";
		while (blockLimit > 0 && i < data.length) {
			blockLimit--;
			if (mode === "fast") {
				let here = {
					x:parseInt(data.substr(i,3))-128,
					y:parseInt(data.substr(i+3,3))-128,
					z:parseInt(data.substr(i+6,3))-128,
					id:parseInt(data.substr(i+9,3))-128,
				}
				i+=12;
				if (here.id === 0 && here.x === 1 && here.y === 1 && here.z === 1)
					mode = "slow";
				else
					blocks.push(here);
			} else {
				let here = {};
				["x","y","z","id"].forEach(property => {

				});
				break;
			}
		}
		return blocks;
	},
	readCompressed: function(data) {
		let i = 14; // Start point
		let blockLimit = 20000;
		let blocks = [];
		let type = "fast";
		while (blockLimit > 0 && i < data.length) {
			blockLimit--;
			if (type === "fast") {
				let here = {
					x: data[i+0],
					y: data[i+1],
					z: data[i+2],
					id: data[i+3]
				}
				if (here.id === 0 && here.x === 1 && here.y === 1 && here.z === 1)
					type = "slow";
				else if (this.isValidBlock(here))
					blocks.push(here);
				else {
					this.errorLoading("invalid or corrupted file");
					blockLimit = -1;
					break;
				}
				i+=4;
			} else if (type === "slow") {
				let here = {
					x: this.formDoubleByteNumber(data[i+0], data[i+1]),
					y: this.formDoubleByteNumber(data[i+2], data[i+3]),
					z: this.formDoubleByteNumber(data[i+4], data[i+5]),
					id: this.formDoubleByteNumber(data[i+6], data[i+7])
				}
				if (this.isValidBlock(here))
					blocks.push(here);
				else {
					this.errorLoading("invalid or corrupted file");
					blockLimit = -1;
					break;
				}
				i+=8;
			}
		}
		console.log(blocks);
		return blocks;
	},
	isValidBlock: function(block) {
		return (typeof block.x === "number" && typeof block.y === "number" && typeof block.z === "number" && typeof block.id === "number" && !isNaN(block.x) && !isNaN(block.y) && !isNaN(block.z) && !isNaN(block.id));
	},
	errorLoading: function(type) {
		logger.error("Unable to read due to " + type);
	},
	takeLeftSide: function(number) {
		return number%256;
	},
	takeRightSide: function(number) {
		if (number >= 256 && number <= 65535)
			return this.takeLeftSide((number-number%256)/256);
		return 0;
	},
	formDoubleByteNumber: function(left, right) {
		return left + right * 256;
	}
}