define([
	"Scripts/Classes/Loading/LoadingStep.js",
	"Scripts/Classes/Loading/ImageLoader.js",
	"Scripts/Data/BlockData.js",
], (LoadingStep, ImageLoader, BlockData) =>
	class TextureAtlas extends LoadingStep {
		constructor() {
			super();
			this.texturePath = "./Images/Textures/";
			debugger;
			this.fileNames = TextureAtlas.getAllUsedImages()
			this.images = this.fileNames.map(fileName => new ImageLoader(fileName));
			//console.log("TextureAtlas got ready to load",this.files.length,"files");
		}
		static getAllUsedImages() {
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
		updateProgress() {
			var p = this.images.reduce((a,n) => a+=(n&&n.ready)?1:0, 0)/(this.images.length);
			this.emit("progress", p);
		}
		load() {
			this.images.map(image => image.on("progress", this.updateProgress.bind(this)));
			return Promise.all(this.images.map(image => image.load()));
		}
	}
);