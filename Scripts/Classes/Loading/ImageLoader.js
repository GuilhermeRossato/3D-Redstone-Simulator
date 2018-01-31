define([
	"Scripts/Classes/Generic/Emitter.js",
], (Emitter) =>
class ImageLoader extends Emitter {
	constructor(imageUrl) {
		super();
		this.imageUrl = imageUrl;
		this.image = new Image();
	}
	load() {
		return new Promise((resolve, reject) => {
			this.image.onload = resolve;
			this.image.onerror = reject;
			try {
				this.src = this.imageUrl;
			} catch (err) {
				reject(err);
			}
		});
	}
}
