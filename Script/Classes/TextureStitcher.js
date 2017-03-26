/* This class puts all textures and all ambient occlusion variations in one big image, to save in GPU performance */

function TextureStitcher(batchSize) {
	this.batchSize = batchSize || 1;
	this.initializeTextures();
	this.loadPrepare();
}

TextureStitcher.prototype = {
	constructor: TextureStitcher,
	initializeTextures: function() {
		var tList, propertyType;
		tList = [];
		function addUniqueTexture(fileName) {
			if (tList.indexOf(fileName) === -1)
				tList.push(fileName);
		}
		this.forEachPropertyInObject(blockData, (property,value)=>{
			propertyType = typeof value.texture;
			if (propertyType === "object") {
				this.forEachPropertyInObject(value.texture, (side,textureName)=>{
					if (typeof textureName === "string")
						addUniqueTexture(textureName);
				}
				);
			} else if (propertyType === "string") {
				addUniqueTexture(value.texture);
			}
		}
		);
		this.textureList = tList;
	},
	loadPrepare: function() {
		this.loaded = 0;
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.textureList.length * 16;
		this.canvas.height = 16*10*4;
		this.ctx = this.canvas.getContext('2d');
		this.images = [];
		repeat(this.batchSize, i=>{
			var img = document.createElement("img")
			img.onload = (ev)=>this.onLoadImage.call(this, ev);
			img.onerror = (ev)=>this.onErrorImage.call(this, ev);
			this.images.push(img);
		});
		this.aoCount = blockFade.length;
		this.aoFades = blockFade.map((fileName, i) => {
			var img = document.createElement("img")
			img.onload = (ev) => { this.aoCount--; };
			img.src = "Images/AmbientOcclusion/" + fileName;
			return img;
		});
		this.textures = {};
		this.log = {
			timeOut: [],
			notFound: [],
			unknownFormat: []
		}
		this.stepState = {
			ready: true,
			waiting: {
				instances: [],
				count: 0
			},
			timeStamp: 0
		}
	},
	drawNewImage: function(image, id) {
		repeat(10*4, height => {
			this.ctx.drawImage(image, 0, 0, 16, 16, (id * 16), height*16, 16, 16);
		});
	},
	onLoadImage: function(ev) {
		var fileName = ev.target.fileName;
		var index = this.stepState.waiting.instances.indexOf(fileName)
		if (index !== -1) {
			if (ev.target.width === 0 || ev.target.height === 0)
				this.log.unknownFormat.push(ev.target.fileName);
			else {
				this.drawNewImage(ev.target, ev.target.idNumber);
			}
			this.stepState.waiting.count--;
			this.stepState.waiting.instances.splice(index, 1);
		} else {
			console.warn("Unexpected onLoad reply of \"" + fileName + '"');
		}
	},
	onErrorImage: function(ev) {
		var fileName = ev.target.fileName;
		var index = this.stepState.waiting.instances.indexOf(fileName)
		if (index !== -1) {
			this.stepState.waiting.count--;
			this.stepState.waiting.instances.splice(index, 1);
			this.ctx.fillStyle = "#333";
			this.ctx.fillRect(ev.target.idNumber * 16, 0, 16, 16);
			this.log.notFound.push(fileName);
		} else {
			console.warn("Unexpected onError reply of \"" + fileName + '"');
		}
	},
	loadStep: function(timeStamp) {
		if (this.aoCount === 0 && this.stepState.waiting.count === 0 || this.stepState.timeStamp - timeStamp > 5000) {
			if (this.stepState.waiting.instances.length > 0) {
				this.log.timeOut.push(...this.stepState.waiting.instances);
			}
			this.stepState.ready = false;
			this.stepState.timeStamp = timeStamp;
			this.stepState.waiting.instances = [];
			this.stepState.waiting.count = Math.min(this.batchSize, this.textureList.length - this.loaded);
			repeat(this.stepState.waiting.count, i=>{
				this.images[i].idNumber = this.loaded;
				this.images[i].fileName = this.textureList[this.loaded];
				this.stepState.waiting.instances.push(this.images[i].fileName);
				this.images[i].src = "Images/Textures/" + this.images[i].fileName;
				this.loaded += 1;
			}
			);
			if (this.loaded >= this.textureList.length) {
				this.loadFinish();
				return new LoadStatus("TextureStitcher","Done",1);
			} else {
				return new LoadStatus("TextureStitcher","Stitching \"" + this.textureList[this.loaded] + '"',this.loaded / this.textureList.length);
			}
		} else {
			if (this.aoCount === 0)
				return new LoadStatus("TextureStitcher","Loading ambient occlusion textures",this.loaded / this.textureList.length);
			else
				return new LoadStatus("TextureStitcher","Stitching \"" + this.textureList[this.loaded] + '" *',this.loaded / this.textureList.length);
		}
	},
	showCanvasResult: function() {
		this.canvas.style.position = "absolute";
		this.canvas.style.left = ((window.innerWidth/2 - this.canvas.width/2)|0)+"px";
		this.canvas.style.top = "0px";
		document.body.appendChild(this.canvas);
	},
	loadFinish: function() {
		this.loaded = this.textureList.length;
		this.result = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		this.showCanvasResult();
	},
	forEachPropertyInObject: function(object, f) {
		for (var property in object) {
			if (object.hasOwnProperty(property)) {
				f(property, object[property]);
			}
		}
	}
}
