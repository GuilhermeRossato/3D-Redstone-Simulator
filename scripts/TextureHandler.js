'use strict';

import BlockData from '../scripts/data/BlockData.js';

export default class WorldHandler {
	constructor(worldHandler) {
		this.handler = worldHandler;
		this.data = BlockData;
	}
	load() {
		var filenames = new Set();

		this.data.forEach(block => {
			for (const key in block.texture.children) {
				const value = block.texture.children[key];
				if (typeof value === "string") {
					filenames.add(value);
				} else {
					filenames.add(...value);
				}
			}
		});

		console.log(filenames);
		/*
		this.data.forEach(block => {

		});
		for (var property in this.data) {
			const value = this.data[property];
		}

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
		*/
	}
}