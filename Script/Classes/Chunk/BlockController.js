function BlockController(scene) {
	this.scene = scene;
	this.blocks = [];
	this.meshes = [];
	this.geometries = {
		cube: new THREE.BoxGeometry(1,1,1),
		redstone: new THREE.BoxGeometry(1,1 / 8,1),
		slab: new THREE.BoxGeometry(1,1 / 2,1)
	}
	this.textureLoader = new THREE.TextureLoader();
	this.lastAddedMesh = {
		id: 0,
		mesh: undefined
	};
	this.nearby = new NearbyController(this);
}
BlockController.prototype = {
	constructor: BlockController,
	includeBlock: function(x, y, z, id, mesh) {
		mesh.realPosition = new THREE.Vector3(x,y,z);
		mesh.gid = id;
		this.blocks.push(mesh);
	},
	getBlock: function(x, y, z) {
		return this.blocks.filter((obj)=>obj.x === x && obj.y === y && obj.z === z)[0];
	},
	getGeo: function(id) {
		if (id >= 203 && id <= 228)
			return this.geometries.slab;
		if (id === 27 || id === 28 || id === 62)
			return this.geometries.redstone;
		return this.geometries.cube;
	},
	putBlockIntoWorld: function(x, y, z, id) {
		var geo = this.getGeo(id);
		var material = this.getMesh(id);
		var cube = new THREE.Mesh(geo,material);
		var data = material.data;
		if (data.position)
			cube.position.set(x + data.position[0], y + data.position[1], z + data.position[2]);
		else
			cube.position.set(x, y, z);
		if (data.rotation)
			cube.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
		this.scene.add(cube);
		this.includeBlock(x, y, z, id, cube)
	},
	setBlock: function(x, y, z, id) {
		var obj = this.getBlock(x, y, z);
		if (typeof obj === "object") {
			if (obj.gid !== id) {
				this.scene.remove(obj.mesh);
				if (id !== 0) {
					this.putBlockIntoWorld(x, y, z, id);
				}
			}
			obj.id === id;
		} else {
			this.putBlockIntoWorld(x, y, z, id);
		}
	},
	getMesh: function(id) {
		if (this.lastAddedMesh.id === id)
			return this.lastAddedMesh.mesh;
		var meshObject = this.meshes.filter((obj)=>obj.id === id)[0];
		this.lastAddedMesh.id = id;
		if (meshObject == undefined) {
			var mesh = this.createFirstMesh(id);
			if (mesh == undefined)
				logger.warn("Unable to create mesh of id " + id);
			else
				return ( this.lastAddedMesh.mesh = mesh) ;
			return undefined;
		} else {
			return ( this.lastAddedMesh.mesh = meshObject.mesh) ;
		}
	},
	getNearbyBlocks() {
		return this.nearby.get();
	},
	updateNearbyBlocks(playerPosition) {
		this.nearby.update(playerPosition.x, playerPosition.y, playerPosition.z);
	},
	createFirstMesh: function(id) {
		var originalData = block_data.filter(obj=>obj.id === id)[0];
		if (originalData) {
			var material, limit;
			limit = 0;
			var data = originalData;
			while ((typeof data === "object") && (data.parent) && ((limit++) < 20)) {
				data = block_data.filter(obj=>obj.id === data.parent)[0];
			}
			if (limit >= 20)
				logger.warn("Unable to process information due to circular referencing (at blockData)");
			if (typeof data.texture === "string") {
				let texture = this.textureLoader.load("Images/Textures/" + data.texture);
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
					let texture = this.textureLoader.load("Images/Textures/" + filename);
					texture.magFilter = THREE.NearestFilter;
					texture.minFilter = THREE.LinearMipMapLinearFilter;
					//texture.anisotropy = 0;
					let mat = new THREE.MeshLambertMaterial({
						color: 0x555555,
						map: texture
					})
					mat.filename = filename;
					return mat;
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
						material.push(texture);
					} else {
						logger.error("Unable to find texture " + data[obj] + " in list of unique textures");
					}
				}
				);
				material = new THREE.MultiMaterial(material);
			}
			material.data = originalData;
			this.meshes.push({
				id: id,
				mesh: material
			});
			return material;
		}
		return false;
	}
}
