function manualRandom() {
	var x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}
function setSeed(x, z) {
	seed = (37 + x + z * 400);
}
function getHeightAt(x, z) {
	return (perlin(x / 30, z / 29) + 1) * 4.5;
}
function generateArea(pos, side) {
	let i, j;
	var map = new Uint8Array(side * side);
	for (i = 0; i < side; i++) {
		for (j = 0; j < side; j++) {
			let height = getHeightAt(i+pos.z, j+pos.x);
			map[i + j * side] = height;
		}
	}
	return map;
}
function removeBlocksFromWorld() {
	scene.children.forEach(obj => {
		if (obj.realPosition instanceof THREE.Vector3) {
			scene.remove(obj);
		}
	});
}
function addBlocksInWorld(ppos) {
	/*
	for (var i = 0 ; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			if (i===0||j===0||i===2||j===2) {
				for (var k = 0; k < 10+j*Math.random(); k++)
					blocks.setBlock(i,k,j,17);
			}
		}
	}
	var size = 4;
	var pos = {x:ppos.x|0, z:ppos.z|0};
	var candidates = [2, 2, 2, 98, 98, 98, 178, 98, 98, 178, 98, 178, 98, 178, 178, 98, 178, 2, 178, 178, 98, 178, 17, 178, 178];
	candidates = candidates.map(obj => (obj===98?24:obj))
	seed = 48;
	for (var i = 0; i < size; i++) {
		for (var j = 0; j < size; j++) {
			var selectedId = candidates[candidates.length * manualRandom() | 0];
			blocks.setBlock(i + (pos.x)-size/2, (4+manualRandom()*1.5)|0+(selectedId===17?1:0), j+(pos.z)-size/2, selectedId);
		}
	}*/
}
world = {
	maxDist: 16,
	lastPos: {x: 0, z: 0},
	chunks: [],
	allActiveChunks: [],
	allDeadChunks: [],
	getBlockId: function(height) {
		if (height > 1)
			return 2;
		else
			return 12;
		
		/*
		var candidates = [56,1,1,1,1,1,1,1,1,1,1,1,14,15,16,21,14,15,16,1,1,73];
		let a = Math.random()*candidates.length;
		if ((a < 1) && Math.random() < 0.99)
			a = Math.random()*candidates.length;
		return candidates[a|0];
		*/
	},
	addChunk: function(x,z) {
		let origin = {x:x*16-8, z:z*16-8};
		let chunk = new THREE.Group();
		chunk.position.set(origin.x+8, 0, origin.z+8);
		chunk.realPosition = {x:x, z:z};
		scene.add(chunk);
		if (!(this.chunks[z] instanceof Array))
			this.chunks[z] = [];
		this.chunks[z][x] = chunk;
		this.allDeadChunks.push(chunk);
	},
	fillChunk: function(chunk) {
		this.allActiveChunks.push(chunk);
		for (var i = 0; i < 16; i++) {
			for (var j = 0; j < 16; j++) {
				let ht = -2+getHeightAt(chunk.position.x+j, chunk.position.z+i)|0
				blocks.setBlock(j-8+chunk.position.x, ht, i-8+chunk.position.z, this.getBlockId(ht));
				let block = blocks.blocks[blocks.blocks.length-1];
				block.position.x -= chunk.position.x;
				block.position.z -= chunk.position.z;
				scene.remove(block);
				chunk.add(block);
			}
		}
		if (!(this.chunks[chunk.realPosition.z+1] instanceof Array) || !(this.chunks[chunk.realPosition.z+1][chunk.realPosition.x] instanceof THREE.Group))
			this.addChunk(chunk.realPosition.x,chunk.realPosition.z+1);
		if (!(this.chunks[chunk.realPosition.z-1] instanceof Array) || !(this.chunks[chunk.realPosition.z-1][chunk.realPosition.x] instanceof THREE.Group))
			this.addChunk(chunk.realPosition.x,chunk.realPosition.z-1);
		if (!(this.chunks[chunk.realPosition.z][chunk.realPosition.x+1] instanceof THREE.Group))
			this.addChunk(chunk.realPosition.x+1,chunk.realPosition.z);
		if (!(this.chunks[chunk.realPosition.z][chunk.realPosition.x-1] instanceof THREE.Group))
			this.addChunk(chunk.realPosition.x-1,chunk.realPosition.z);
	},
	clearChunk: function(chunk) {
		chunk.children.splice(0,16*16);
	},
	destroyChunk: function(chunk) {
		scene.remove(chunk);
		this.chunks[chunk.realPosition.z][chunk.realPosition.x]	= undefined;
	},
	init: function(pos) {
		this.addChunk((pos.x/16|0),(pos.z/16|0));
	},
	update: function(playerPos) {
		let pos = {x:playerPos.x, y:0, z:playerPos.z};
		if (false && this.allDeadChunks.length === 0) { // debug
			this.addChunk(0,0);
			this.fillChunk(this.allDeadChunks.pop());
			this.addChunk(0,1);
			this.fillChunk(this.allDeadChunks.pop());
			this.addChunk(1,1);
			this.fillChunk(this.allDeadChunks.pop());
			this.addChunk(1,0);
			this.fillChunk(this.allDeadChunks.pop());
		} else if (this.allDeadChunks.length === 0) {
			this.init(pos);
		} else {
			let len, i, chunk, dist;
			//return; // THIS STOPS PROCEDURAL TERRAIN GENERATION
			len = this.allDeadChunks.length;
			for (i=0;i<len;i++) {
				chunk = this.allDeadChunks[i];
				dist = chunk.position.distanceToSquared(pos)
				if (dist < 32*32) {
					this.allDeadChunks.splice(i,1);
					this.fillChunk(chunk);
					i--;
					len--;
				} else if (dist > 56*56) {
					this.allDeadChunks.splice(i,1);
					this.destroyChunk(chunk);
					i--;
					len--;
				}
			}
			len = this.allActiveChunks.length;
			for (i=0;i<len;i++) {
				chunk = this.allActiveChunks[i];
				if (chunk.position.distanceToSquared(pos) > 36*36) {
					this.allDeadChunks.push(this.allActiveChunks.splice(i,1)[0]);
					this.clearChunk(chunk);
					i--;
					len--;
				}
			}
		}
	},
	lightUpdate: function() {}
}
