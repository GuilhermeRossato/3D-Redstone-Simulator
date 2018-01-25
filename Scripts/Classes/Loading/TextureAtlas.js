define([
	"Scripts/Classes/Loading/LoadingStep.js",
	"Scripts/Data/BlockData.js"
], (LoadingStep, BlockData) =>
	class TextureAtlas extends LoadingStep {
		constructor() {
			super();
			this.texturePath = "./Images/Textures/";
			this.files = this.getAllUsedImages();
			console.log("TextureAtlas got ready to load",this.files.length,"files");
		}
		getAllUsedImages() {
			var files = [];
			BlockData.forEach(block => {
				if (block.texture.children instanceof Array) {
					files.push(...block.texture.children.map(f=>(this.texturePath+f)));
				} else {
					for (var key in block.texture.children) {
						if (block.texture.children.hasOwnProperty(key)) {
							files.push(block.texture.children[key]);
						}
					}
				}
			});
			return files;
		}
		updateProgress(successCallback) {
			this.progress = this.images.reduce((a,n) => a+=(n&&n.ready)?1:0, 0)/(this.images.length);
			this.onProgress(this.progress);
			if (this.progress >= 1) {
				successCallback(this.images);
			}
		}
		load() {
			return new Promise((resolve, reject) => {
				this.images = this.files.map((file,i) => {
					var img = new Image();
					img.onload = (ev) => {
						img.ready = true;
						this.updateProgress(resolve);
						delete img.onload;
					}
					img.onerror = (ev) => {
						img.ready = true;
						this.updateProgress(resolve);
						delete img.onerror;
					}
					img.src = file;
					return img;
				});
			});
		}
	}
);