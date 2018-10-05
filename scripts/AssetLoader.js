'use strict';

export default class AssetLoader {
	constructor() {
	}
	async loadFile(filename) {
		const response = await fetch(filename, {
			method: 'get',
			mode: 'cors',
			cache: 'no-store'
		});
		return (await response.blob());
	}
	loadImage(filename) {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onLoad = ()=>resolve(image);
			image.onError = (err)=>reject(err);
			image.src = filename;
		})
	}
}