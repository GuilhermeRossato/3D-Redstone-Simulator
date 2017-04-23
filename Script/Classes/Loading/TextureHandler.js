/*
 * This class generates instances of THREE.Texture's from Image objects while using the ImageLoader to load them.
 *
 * @TextureLoader
 * @author: Guilherme Rossato
 *
*/

function TextureHandler(world) {
	this.world = world;
	this.textures = {};
}

TextureHandler.prototype = {
	constructor: TextureHandler,
	getTexture: function(name) {
		if (this.textures[name])
			return this.textures[name];
		else
			console.error("No texture for selected id");
	},
	createTexture: function(name, image) {
		let texture = new THREE.Texture();
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.LinearFilter;
		texture.image = image;
		texture.needsUpdate = true;
		//texture.anisotropy = 0; // Proven to be unnecessary at the time
		let material = new THREE.MeshLambertMaterial({
			map: texture,
			color: 0x555555
		});
		return material;
	},
	handleFinishedImages: function() {
		this.textureList.forEach((name,i)=>{
			if (!this.textures[name])
				this.textures[name] = this.createTexture(name, this.imageList[i]);
		});	
	},
	parseBlockList: function(blockList) {
		var tList, propertyType;
		tList = [];
		function addUniqueTexture(fileName) {
			if (tList.indexOf(fileName) === -1)
				tList.push(fileName);
		}
		this.forEachPropertyInObject(blockList, (property,value)=>{
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
		ImageLoader.on("done", ev=>this.handleFinishedImages(ev));
		this.imageList = ImageLoader.loadImageList(tList.map(fileName => "Images/Textures/"+fileName));
		this.textureList = tList;
	},
	getProgress: function() {
		return ImageLoader.getProgress();
	},
	forEachPropertyInObject: function(object, f) {
		for (var property in object) {
			if (object.hasOwnProperty(property)) {
				f(property, object[property]);
			}
		}
	}
}