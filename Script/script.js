function getHeightTest() {
	return 0;
}
var test = {
	count:0,
	meshes: [],
	setup: function() {
		this.textures = [
		"stone.png",
		"grass_green.png",
		"grass_side.png",
		"hardened_clay.png"
		].map((filename)=>{
			let texture = blocks.textureLoader.load("Images/Textures/"+filename);
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.LinearMipMapLinearFilter;
			return texture;
		});
		this.plane = new THREE.PlaneGeometry(1, 1, 1, 1);
		this.single = new THREE.Geometry();
	},
	sides: [["z",0.5,"z",0], // Front
		 ["z",-0.5,"y",1], // Back
		 ["x",0.5,"y",0.5], // Right
		 ["x",-0.5,"y",-0.5], // Left
		 ["y",0.5,"x",-0.5], // Top
		 ["y",-0.5,"x",0.5] // Down
		 ],
	edit: function() {

	},
	clearSingleGeometry: function() {
		this.single.vertices = [];
		this.single.faces = [];
		this.single = new THREE.Geometry();
	},
	addBlock: function(x, y, z) {
		let geometry = this.plane;
		let meshes = [
			new THREE.Mesh(geometry),
			new THREE.Mesh(geometry),
			new THREE.Mesh(geometry),
			new THREE.Mesh(geometry),
			new THREE.Mesh(geometry),
			new THREE.Mesh(geometry)
		];
		this.sides.forEach((data,i)=>{
		 	meshes[i].position[data[0]] = data[1];
		 	meshes[i].rotation[data[2]] = data[3]*Math.PI;
		});
		meshes.forEach(mesh => {
			mesh.position.add({x:x,y:y,z:z});
			mesh.updateMatrix()
			this.single.merge(mesh.geometry, mesh.matrix);
		});
	},
	add: function() {
		// Add each block to geometry
		let i = 0;
		let j = 0;
		let size = 60;
		for (i = -size/2; i < size/2; i++)
			for (j = -size/2; j < size/2; j++)
				this.addBlock(i,getHeightTest(),j);
		// Create final mesh
		let material = new THREE.MeshLambertMaterial({
			color: 0x555555,
			map: this.textures[1],
			side: THREE.FrontSide
		});
		let mesh = new THREE.Mesh(this.single, material);
		mesh.updateMatrix();
		this.meshes.push(mesh);
		scene.add(mesh);
	},
	remove: function() {
		this.meshes.forEach(obj => {
			scene.remove(obj);
		})
		this.meshes = [];
		this.clearSingleGeometry();
	},
	update: function() {
		if (this.count === 0)
			this.setup();
		if (this.count < 120) {
			this.count++;
		} else {
			this.remove();
			this.count = 1;
			this.add();
		}
	}
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
world = {
	maxDist: 16,
	lastPos: {x: 0, z: 0},
	chunks: [],
	allActiveChunks: [],
	allDeadChunks: [],
	getBlockId: function(height) {
		return (height > 2)?2:12;
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
		return;
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
	setup: function() {
		console.log("started");
		this.setup = () => {};	
	},
	init: function(pos) {
		this.addChunk((pos.x/16|0),(pos.z/16|0));
	},
	update: function(playerPos) {
		test.update();
		this.setup();
		let pos = {x:playerPos.x, y:0, z:playerPos.z};
		if (true && this.allDeadChunks.length === 0) { // debug
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
			return; // THIS STOPS PROCEDURAL TERRAIN GENERATION
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


function placePlayer(x,y,z) {
	x = x || -37;
	y = y || 11;
	z = z || 37;
	player.controls.player.position.set(x,y,z);
}