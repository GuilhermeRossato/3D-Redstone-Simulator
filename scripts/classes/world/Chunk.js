export default class Chunk {
	construct(cx, cy, cz) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.blocks = [];
		this.blockList = [];
	}
	rebuildMesh() {

	}
	updateMesh() {
		
	}
	set(x, y, z, id) {
		if (id === 0) {
			this.clearBlock(x, y, z);
			this.rebuildMesh();
		} else if (this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]) {
			this.replaceBlock(x, y, z, id);
			this.rebuildMesh();
		} else {
			this.addBlock(x, y, z, id);
			this.updateMesh();
		}
	}
	clearBlock(x, y, z) {

	}
	replaceBlock(x, y, z, id) {

	}
	addBlock(x, y, z, id) {

	}
}