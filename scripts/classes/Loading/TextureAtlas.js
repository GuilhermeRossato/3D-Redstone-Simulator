define([
	"scripts/Classes/Loading/LoadingStep.js",
	"scripts/Classes/Loading/ImageLoader.js",
	"scripts/Data/BlockData.js",
], (LoadingStep, ImageLoader, BlockData) =>
	class TextureAtlas extends LoadingStep {
		constructor() {
			super();
			this.texturePath = "./images/Textures";
			this.fileNames = TextureAtlas.getAllUsedimages().map(fileName => this.texturePath+"/"+fileName);
			this.images = this.fileNames.map(fileName => new ImageLoader(fileName));
			//console.log("TextureAtlas got ready to load",this.files.length,"files");
		}
		static getAllUsedimages() {
			var files = [];
			BlockData.forEach(block => {
				if (block.texture.children instanceof Array) {
					files.push(...block.texture.children);
				} else {
					for (var key in block.texture.children) {
						if (block.texture.children.hasOwnProperty(key)) {
							if (block.texture.children[key] instanceof Array) {
								files.push(...block.texture.children[key]);
							} else {
								files.push(block.texture.children[key]);
							}
						}
					}
				}
			});
			return files;
		}
		load() {
			var promises = Promise.all(this.images.map(image => image.load()));
			this.emit("progress", 1);
			return promises;
		}
	}
);