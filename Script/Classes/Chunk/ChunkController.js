function ChunkController(scene) {
	this.scene = scene;
	this.blocks = [];
	this.meshes = [];
	this.geometries = {
		cube: new THREE.BoxGeometry(1,1,1),
		redstone: new THREE.BoxGeometry(1,1 / 8,1),
		slab: new THREE.BoxGeometry(1,1 / 2,1),
	}
	this.textureLoader = new THREE.TextureLoader();
	this.nearby = {
		// This "nearby" object is a double buffered list of a 11x11x11 cube around the player.
		positive: new Uint8Array(11*11*11),
		negative: new Uint8Array(),
		state: 0,
		progress: 0,
		lastStop: 0,
		position: new THREE.Vector3(0, 0, 0),
		toggle: function(x, y, z) {
			console.log("Toggled");
			if (typeof x !== "number" || typeof y !== "number" || typeof z != "number") {
				if (typeof logger === "object")
					logger.warn("Incorrect parameters for nearby blocks toggling");
				return false;
			}
			this.position.set(x, y, z);
			this.progress = 0;
			this.lastStop = 0;
			if (this.state === 0) {
				this.state = 1;
				this.negative = new Uint8Array(11 * 11 * 11);
			} else {
				this.state = 0;
				this.positive = new Uint8Array(11 * 11 * 11);
			}
		},
		update: function(x, y, z) {
			if (this.progress < 32)
				this.progress++;
			else
				this.toggle(x, y, z);
			let blockList = this.parent.blocks;
			let iMax = blockList.length;
			if (this.lastStop < iMax) {
				let quantityStep = Math.ceil(blockList.length/32);
				let iStart = this.lastStop;
				let iEnd = this.lastStop+quantityStep;
				let dirty = (this.state === 0) ? this.positive : this.negative;
				let i;
				if (iStart == 0)
					iStart = -1;
				for (i = iEnd; i > iStart; i--) {
					if (i < iMax) {
						let block = blockList[i];
						let actualId = this.toId(block.position.x, block.position.y, block.position.z);
						if (actualId != -1) {
							if (dirty[actualId] != 0)
								console.warn("Id "+actualId+" already contains "+dirty[actualId]);
							dirty[actualId] = block.blockId;
							//console.log("At",actualId,"set",block.position.x, block.position.y, block.position.z)
						}
					}
				}
				if (iStart == -1)
					iStart = 0;
				if (i == -1)
					i = 0;
				if (i == iStart)
					this.lastStop += quantityStep;
			}
		},
		get: function() {
			return (this.state === 0) ? this.negative : this.positive;
		},
		toId: function(x, y, z) {
			x = x - this.position.x + 5;
			y = y - this.position.y + 5;
			z = z - this.position.z + 5;
			if (x >= 0 && x < 11 && y >= 0 && y < 11 && z >= 0 && z < 11) {
				return x + y * 11 + z * 11 * 11;
			} else {
				return -1;
			}
		}
	}
	this.nearby.parent = this;
}
ChunkController.prototype = {
	constructor: ChunkController,
	addBlock: function(x, y, z, id, mesh) {
		this.blocks.push({
			x: x,
			y: y,
			z: z,
			id: id,
			mesh: mesh
		});
	},
	getBlock: function(x, y, z) {
		return this.blocks.filter((obj)=>obj.x === x && obj.y === y && obj.z === z)[0];
	},
	setBlock: function(x, y, z, id) {
		var obj = this.getBlock(x, y, z);
		if (typeof obj === "object") {
			if (id === 0 && obj.id !== id) {} else if (obj.id !== id) {
				this.scene.remove(obj.mesh);
			}
			obj.id === id;
		} else if (id !== 0) {
			this.addBlock(x, y, z, id);
		}
	},
	getMesh: function(id) {
		var meshObject = this.meshes.filter((obj)=>obj.id === id)[0];
		if (meshObject == undefined) {
			var mesh = this.createFirstMesh(id);
			if (mesh == undefined)
				logger.warn("Unable to create mesh of id " + id);
			else
				return mesh;
			return undefined;
		} else {
			return meshObject.mesh;
		}
	},
	getNearbyBlocks() {
		return this.nearby.get();
	},
	updateNearbyBlocks(playerPosition) {
		this.nearby.update(playerPosition.x, playerPosition.y, playerPosition.z);
	},
	createFirstMesh: function(id) {
		var data = block_data.filter(obj=>obj.id === id)[0];
		if (data) {
			var material, texture;
			if (typeof data.texture === "string") {
				texture = this.textureLoader.load("Images/Textures/" + data.texture);
				texture.magFilter = THREE.NearestFilter;
				texture.minFilter = THREE.LinearMipMapLinearFilter;
				texture.anisotropy = 0;
				material = new THREE.MeshLambertMaterial({
					color: 0x555555,
					map: texture
				});
			} else if (typeof data.texture === "object") {
				var uniqueTextures = [];
				[data.texture.top, data.texture.left, data.texture.right, data.texture.front, data.texture.back, data.texture.bottom].forEach(obj=>{
					if (uniqueTextures.indexOf(obj) === -1)
						uniqueTextures.push(obj);
				}
				);
				uniqueTextures = uniqueTextures.map(filename=>{
					texture = this.textureLoader.load("Images/Textures/" + filename);
					texture.filename = filename;
					texture.magFilter = THREE.NearestFilter;
					texture.minFilter = THREE.LinearMipMapLinearFilter;
					texture.anisotropy = 0;
					return texture
				}
				);
				material = [];
				["right", "left", "top", "bottom", "back", "front"].forEach(obj=>{
					// find the texture of that filename
					texture = undefined;
					uniqueTextures.some(object=>{
						if (object.filename == data.texture[obj]) {
							texture = object;
							return true;
						}
						return false;
					}
					);
					if (texture) {
						material.push(new THREE.MeshLambertMaterial({
							color: 0x555555,
							map: texture
						}));
					} else {
						logger.error("Unable to find texture " + data[obj] + " in list of unique textures");
					}
				}
				);
				material = new THREE.MultiMaterial(material);
			}
			this.meshes.push({
				id: id,
				mesh: material
			});
			return material;
		}
		return false;
	}
}
