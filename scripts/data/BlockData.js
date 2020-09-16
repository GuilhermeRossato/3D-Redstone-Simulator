/** @type {{name: string, isSolid?: false, faceCount?: number, isRedstone?: true, isTorch?: true, texture?: string | string[] | string[][]}[]} */
const BlockData = [{
	name: "Air"
}, {
	name: "Stone",
	texture: ["stone0.png", "stone1.png", "stone2.png", "stone3.png", "stone4.png", "stone5.png", "stone6.png", "stone7.png"]
}, {
	name: "Wooden Planks",
	texture: "plank.png"
}, {
	name: "Stone Brick",
	texture: "stonebrick.png"
}, {
	name: "Smooth Standstone",
	texture: ["sandstone0.png", "sandstone1.png", "sandstone2.png", "sandstone3.png"]
}, {
	name: "Redstone Dust",
	faceCount: 1,
	isSolid: false,
	isRedstone: true,
	texture: ["redstone-full-off.png", "redstone-line-off.png", "redstone-intersection-off.png", "redstone-corner-off.png"]
}, {
	name: "Redstone Dust",
	faceCount: 1,
	isSolid: false,
	isRedstone: true,
	texture: ["redstone-full-on.png", "redstone-line-on.png", "redstone-intersection-on.png", "redstone-corner-on.png"]
}, {
	name: "Redstone Torch",
	isTorch: true,
	isSolid: false,
	texture: ["redstone-torch-off.png", "redstone-torch-off.png", "redstone-torch-off.png", "redstone-torch-off.png", "redstone-torch-top-off.png", "redstone-torch-bottom.png"]
}, {
	name: "Redstone Torch",
	isTorch: true,
	isSolid: false,
	texture: ["redstone-torch-on.png", "redstone-torch-on.png", "redstone-torch-on.png", "redstone-torch-on.png", "redstone-torch-top-on.png", "redstone-torch-bottom.png"]
}];

export default BlockData;