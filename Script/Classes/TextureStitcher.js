/* This class puts all textures and all ambient occlusion variations in one big image, to save in GPU performance */

function TextureStitcher(batchSize) {
	this.batchSize = batchSize || 1;
	this.parseTextures();
	this.loadPrepare();
	this.textureIds = {};
}

TextureStitcher.prototype = {
	constructor: TextureStitcher,
	putTextureInFace: function(geometry, texture, ao) {
		//var _x = (x)/16, _y = 1-((y+1)/16), _h = 1/16, _w = 1/16;
		//this.setUv0([_x,_h+_y,_x,_y,_w+_x,_h+_y])
		let vec = this.getTexturePosition(texture, ao);
		let faceVertex0 = geometry.faceVertexUvs[0][0]
		  , faceVertex1 = geometry.faceVertexUvs[0][1]
		  , x = vec.x
		  , y = vec.y
		  , size = this.tilesHorizontally;
		faceVertex0[0].x = x / size;
		faceVertex0[0].y = 1 / size + (1 - ((y + 1) / size));
		// (size+2-y)/size;
		faceVertex0[1].x = x / size;
		faceVertex0[1].y = 1 - ((y + 1) / size);
		faceVertex0[2].x = (1 + x) / size;
		faceVertex0[2].y = 1 / size + (1 - (y + 1) / size);
		faceVertex1[0].x = x / size;
		faceVertex1[0].y = 1 - (y + 1) / size;
		// (size+2-y)/size;
		faceVertex1[1].x = (1 + x) / size;
		faceVertex1[1].y = ((size-1) - y) / size;
		faceVertex1[2].x = 1 / size + x / size;
		faceVertex1[2].y = 1 / size + (1 - (y + 1) / size);
	},
	getTexturePosition: function(texture, ao) {
		var textureId = (this.textureIds[texture] || 0) + (ao || 0);
		return this.getXY(textureId);
	},
	parseTextures: function() {
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
		let totalTextures = this.textureList.length * blockFade.length;
		for (var i = 16; i <= 512; i*=2) {
			if (totalTextures < i*i) {
				console.log("TextureSticher Size set to",i);
				this.tilesHorizontally = i;
				this.canvas.width = this.canvas.height = i*16;
				break;
			} else if (i === 512)
				throw "Too Many Textures!";
		}
		this.ctx = this.canvas.getContext('2d');
		//this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
		console.log("canvas Size",this.canvas.width, this.canvas.height, this.tilesHorizontally);
		this.images = [];
		repeat(this.batchSize, i=>{
			let img = document.createElement("img")
			img.onload = (ev)=>this.onLoadImage.call(this, ev);
			img.onerror = (ev)=>this.onErrorImage.call(this, ev);
			this.images.push(img);
		});
		this.aoCount = blockFade.length;
		this.aoFades = blockFade.map((fileName, i) => {
			let img = document.createElement("img")
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
		this.drawnTextures = 0;
	},
	getXY: function(textureId) {
		//width = this.tilesHorizontally;
		return {x: textureId % this.tilesHorizontally, y: (textureId / this.tilesHorizontally)|0}
	},
	drawNewImage: function(image, id) {
		var imageName = this.textureList[image.idNumber];
		this.textureIds[imageName] = this.drawnTextures;
		repeat(this.aoFades.length, i => {
			var pos = this.getXY(this.drawnTextures);
			this.ctx.drawImage(image, 0, 0, 16, 16, pos.x*16, pos.y*16, 16, 16);
			if (i > 0) {
				this.ctx.drawImage(this.aoFades[i-1], 0, 0, 16, 16, pos.x*16, pos.y*16, 16, 16);
			}
			this.drawnTextures++;
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
	loadFakeImageOverlay: function() {
		var img = document.createElement("img");
		img.src = "Images/AmbientOcclusion/full.png";
		img.onload = () => {
			this.ctx.drawImage(img, 0, 0);
			this.result = this.canvas.toDataURL();
		}
	},
	loadFinish: function() {
		//this.loadFakeImageOverlay();
		this.loaded = this.textureList.length;
		//this.result = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		try {
			this.result = this.canvas.toDataURL();
		} catch (err) {
			console.log("unable to do anything");
		}
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
