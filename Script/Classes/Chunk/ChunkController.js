function ChunkController() {
	this.blocks = [];
}
ChunkController.prototype = {
	constructor: ChunkController,
	addBlock: function(x, y, z, id) {
		this.blocks.push({
			x: x,
			y: y,
			z: z,
			id: id
		});
	},
	getBlock: function(x, y, z) {
		return this.blocks.filter((obj)=>obj.x === x && obj.y === y && obj.z === z)[0] || 0;
	},
	setBlock: function(x, y, z, id) {
		var obj = this.getBlock(x, y, z);
		if (typeof obj === "object")
			obj.id === id;
		else if (id !== 0)
			this.addBlock(x, y, z, id);
	}
}
