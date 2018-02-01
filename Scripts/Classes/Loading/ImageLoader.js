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
			this.image.onload = ()=>{
				this.emit("progress", 1);
				resolve();
			}
			this.image.onerror = () => {
				this.emit("progress", 1);
				reject();
			}
			try {
				this.src = this.imageUrl;
			} catch (err) {
				reject(err);
			}
		});
	}
});
