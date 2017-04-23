function WorldSaver(world) {
	this.world = world;
	document.addEventListener('keydown', (event)=>this.onKeyDown(event, event.code, event.ctrlKey), false);
}

var globy = 0;

WorldSaver.prototype = {
	constructor: WorldSaver,
	onKeyDown: function(event, code, ctrlKey) {
		if (window.File && window.FileReader && window.FileList && window.Blob) {
			if (ctrlKey && code === options.keys.save) {
				this.save(true);
				event.preventDefault();
			}
		} else {
			logger.log("Error: Browser doesn't have file support");
		}
	},
	isWithinArea: function(obj) {
		return ( obj.x > -127 && obj.x < 128 && obj.y > -128 && obj.y < 128 && obj.z > -127 && obj.z < 128 && obj.id < 256) ;
	},
	getDataSize: function(blocksNear, blocksFar) {
		return blocksNear * 4 + 4 + (blocksFar) * 8;
	},
	save: function(isCompressed) {
		if (isCompressed) {
			this.saveCompressed();
		} else {
			this.saveLarge();
		}
	},
	saveLarge: function() {
		let type = "mcworld-js";
		let typeSize = type.length;
	},
	saveCompressed: function() {
		let type = "mcworld-min-js";
		let typeSize = type.length;
		let blocksNear = [];
		let blocksFar = [];
		this.world.getBlockList().forEach(obj=>{
			if (obj && obj.id > 0) {
				if (this.isWithinArea(obj))
					blocksNear.push(obj);
				else
					blocksFar.push(obj);
			}
		}
		);
		let dataSize = typeSize+this.getDataSize(blocksNear.length, blocksFar.length);
		let saveIndex = 0;
		let data = new Uint8Array(dataSize);
		repeat(blocksNear.length+blocksFar.length, (i) => {
			if (i < blocksNear.length) {
				saveIndex = typeSize+i*4;
				data[saveIndex+0] = blocksNear[i].x;
				data[saveIndex+1] = blocksNear[i].y;
				data[saveIndex+2] = blocksNear[i].z;
				data[saveIndex+3] = blocksNear[i].id;
			} else {
				if (i === blocksNear.length) {
					saveIndex = typeSize+i*4;
					data[saveIndex+0] = 1;
					data[saveIndex+1] = 1;
					data[saveIndex+2] = 1;
					data[saveIndex+3] = 0;
				}
				saveIndex = typeSize+blocksNear.length*4+(i-blocksNear.length)*8+4;
				data[saveIndex+0] = this.takeLeftSide(blocksFar[i-blocksNear.length].x);
				data[saveIndex+1] = this.takeRightSide(blocksFar[i-blocksNear.length].x);
				data[saveIndex+2] = this.takeLeftSide(blocksFar[i-blocksNear.length].y);
				data[saveIndex+3] = this.takeRightSide(blocksFar[i-blocksNear.length].y);
				data[saveIndex+4] = this.takeLeftSide(blocksFar[i-blocksNear.length].z);
				data[saveIndex+5] = this.takeRightSide(blocksFar[i-blocksNear.length].z);
				data[saveIndex+6] = this.takeLeftSide(blocksFar[i-blocksNear.length].id);
				data[saveIndex+7] = this.takeRightSide(blocksFar[i-blocksNear.length].id);
			}
		});
		repeat(typeSize, (i) => {
			data[i] = type.charCodeAt(i);
		});
		if (typeof saveAs === "function") {
			let info = []
			console.log(data);
			data.forEach((number) => {
				info.push(String.fromCharCode(number));
			});
			console.log(info.map(obj => obj.charCodeAt()));
			let blob = new Blob(info);
			globy = blob;
			saveAs(blob, "world.rmc", false);
			return blob;
		} else {
			console.warn("Warning: no saving mechanism!")
			return data;
		}
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