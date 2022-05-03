'use strict';

export default class AssetLoader {
	async loadFile(filename) {
		const response = await fetch(filename, {
			method: 'get',
			mode: 'cors',
			cache: 'no-store'
		});
		var blob = (await response.blob());
		return blob;
	}

	loadImage(filename) {
		return new Promise((resolve, reject) => {
			if (!filename || filename.trim().length === 0) {
				reject(new Error("Required parameter 'filename' not provided for loadImage"))
			}
			try {
				const image = new Image();
				image.onload = ()=>resolve(image);
				image.onerror = ()=>reject(new Error("Could not load image \""+filename+"\""));
				image.src = filename;
			} catch (err) {
				console.log("caught before");
				console.log(err);
				reject(err);
			}
			window.setTimeout(reject.bind(this, new Error("Timeout on image load ("+filename+")")), 8000);
		})
	}
}