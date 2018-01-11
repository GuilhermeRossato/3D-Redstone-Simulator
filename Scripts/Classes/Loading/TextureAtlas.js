define(["Scripts/Classes/Loading/LoadingStep.js", "Scripts/Data/BlockData.js"], (LoadingStep, BlockData) =>
	class TextureAtlas extends LoadingStep {
		constructor() {
			super();
			this.files = TextureAtlas.getAllUsedImages();
			console.log("TextureAtlas got ready to load",this.files.length,"files");
		}
		static getAllUsedImages() {
			var files = [];
			BlockData.forEach(block => {
				if (block.texture.children instanceof Array) {
					files.push(...block.texture.children);
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
		updateProgress() {
			this.progress = this.images.reduce((a,n) => a+=(n&&n.ready))/this.images.length;
			console.log(this.progress);
			this.onProgress(this.progres);
		}
		load() {
			return new Promise((resolve, reject) => {
				this.images = this.files.map((file,i) => {
					var img = new Image();
					img.onload = (ev) => {
						img.ready = true;
						this.updateProgress();
						delete img.onload;
					}
					img.src = file;
					return img;
				});
			});
		}
	}
);