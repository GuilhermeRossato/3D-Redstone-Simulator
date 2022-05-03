import { noise4d } from "../libs/SimplexNoise.js";

function getReproduciblyRandomAvailableTexture(sideNumber, x, y, z) {
	return this.textureList[Math.abs(Math.floor((noise4d(x, y, z, sideNumber) * 1000))) % this.textureList.length];
}

window.getReproduciblyRandomAvailableTexture = getReproduciblyRandomAvailableTexture;

/** @type {{name: string, isSolid?: false, faceCount?: number, isRedstone?: true, isTorch?: true, texture?: string | string[] | string[][]}[]} */
const BlockData = [{
	name: "Air"
}, {
	name: "Stone",
	texture: getReproduciblyRandomAvailableTexture,
	textureList: ["stone0.png", "stone1.png", "stone2.png", "stone3.png", "stone4.png", "stone5.png", "stone6.png", "stone7.png"]
}, {
	name: "Wooden Planks",
	texture: "plank.png"
}, {
	name: "Stone Brick",
	texture: "stonebrick.png"
}, {
	name: "Smooth Standstone",
	texture: getReproduciblyRandomAvailableTexture,
	textureList: ["sandstone0.png", "sandstone1.png", "sandstone2.png", "sandstone3.png"]
}, {
	name: "Redstone Dust",
	faceCount: 1,
	isSolid: false,
	isRedstone: true,
	textureList: ["redstone-full-off.png", "redstone-line-off.png", "redstone-intersection-off.png", "redstone-corner-off.png"]
}, {
	name: "Redstone Dust",
	faceCount: 1,
	isSolid: false,
	isRedstone: true,
	textureList: ["redstone-full-on.png", "redstone-line-on.png", "redstone-intersection-on.png", "redstone-corner-on.png"]
}, {
	name: "Redstone Torch Off",
	isTorch: true,
	isSolid: false,
	texture: {
        top: 'redstone-torch-top-off.png',
        bottom: 'redstone-torch-bottom.png',
        left: 'redstone-torch-off.png',
        right: 'redstone-torch-off.png',
        front: 'redstone-torch-off.png',
        back: 'redstone-torch-off.png',
	}
}, {
	name: "Redstone Torch On",
	faceCount: 5,
	isTorch: true,
	isSolid: false,
	texture: {
        top: 'redstone-torch-top-on.png',
        bottom: 'redstone-torch-bottom.png',
        left: 'redstone-torch-on.png',
        right: 'redstone-torch-on.png',
        front: 'redstone-torch-on.png',
        back: 'redstone-torch-on.png',
	}
}];

export default BlockData;