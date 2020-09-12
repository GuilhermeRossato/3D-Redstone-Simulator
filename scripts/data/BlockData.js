/** @type {{name: string, faceCount?: number, isRedstone?: boolean, texture?: string | string[] | string[][]}[]} */
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
	isRedstone: true,
	texture: ["redstone-full-off.png", "redstone-line-off.png", "redstone-intersection-off.png", "redstone-corner-off.png"]
}, {
	name: "Redstone Dust",
	faceCount: 1,
	isRedstone: true,
	texture: ["redstone-full-on.png", "redstone-line-on.png", "redstone-intersection-on.png", "redstone-corner-on.png"]
}];

export default BlockData;