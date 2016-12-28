function ChunkController(scene, meshes) {
	this.blocks = [];
	this.directedScene = scene;
	this.meshes = [];
	this.cubeGeometry = new THREE.BoxGeometry(1,1,1);
	this.redstoneGeometry = new THREE.BoxGeometry(1,1 / 8,1);
	this.slabGeometry = new THREE.BoxGeometry(1,0.5,1);
	this.textureLoader = new THREE.TextureLoader();
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
		var mesh = this.meshes.filter((obj)=>obj.id === id)[0];
		if (mesh == undefined) {
			logger.warn("Unable to find mesh of id " + id);
			return undefined;
		} else {
			return mesh.mesh;
		}
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
			return true;
		}
		return false;
	}
}
