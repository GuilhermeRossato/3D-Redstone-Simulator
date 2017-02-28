function WorldHandler(scene) {
	this.scene = scene;
	this.blocks = [];
	this.faces = [];
	this.globs = [];
	this.plane = new THREE.PlaneGeometry(1,1,1,1);
	this.textureLoader = new THREE.TextureLoader();
	this.lastBlockDetails = {
		x: 0,
		y: 0,
		z: 0,
		id: 0,
		match: function(x, y, z, id) {
			return ( this.x === x && this.y === y && this.z === z && this.id === id) ;
		},
		set: function(x, y, z, id) {
			this.x = x;
			this.y = y;
			this.z = z;
			this.id = id;
		}
	}
}

WorldHandler.prototype = {
	constructor: WorldHandler,
	sidesDisplacement: [["z", 0.5, "z", 0], // Front (0)
	["z", -0.5, "y", 1], // Back (1)
	["x", 0.5, "y", 0.5], // Right (2)
	["x", -0.5, "y", -0.5], // Left (3)
	["y", 0.5, "x", -0.5], // Top (4)
	["y", -0.5, "x", 0.5]// Down (5)
	],
	facesDisplacement: [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]],
	getFace: function(x, y, z, side) {
		if (this.faces[y] && this.faces[y][x] && this.faces[y][x][z])
			return this.faces[y][x][z][side];
	},
	setTouchingFacesVisibility: function(x, y, z, state) {
		this.facesDisplacement.forEach((obj,i)=>{
			let face = this.getFace(x + obj[0], y + obj[1], z + obj[2], i);
			if (face)
				face.visible = state;
		}
		);
	},
	hideTouchingFaces: function(x, y, z) {
		this.setTouchingFacesVisibility(x, y, z, false);
	},
	showTouchingFaces: function(x, y, z) {
		this.setTouchingFacesVisibility(x, y, z, true);
	},
	setBlock: function(x, y, z, id) {
		if (!this.lastBlockDetails.match(x, y, z, id)) {
			this.lastBlockDetails.set(x, y, z, id);
			if (this.getBlockId(x, y, z)) {
				this.removeBlock(x, y, z);
			}
			let bd = blockData[id];
			if (bd) {
				let blockInfo = {id: id}
				if (!bd.transparent) {
					this.hideTouchingFaces(x, y, z);
				} else {
					blockInfo.transparent = true;
				}
				let faces = this.generateFaces(id, bd);
				this.putFacesIntoWorld(x,y,z,faces);
			} else {
				logger.warn("No render info for block id " + id.toString());
			}
		}
	},
	putFacesIntoWorld: function(x,y,z,faces) {
		if (!this.faces[y])
			this.faces[y] = [];
		if (!this.faces[y][x])
			this.faces[x] = [];
		this.faces[y][x][z] = faces;
		faces.forEach(face=>{
			scene.add(face);
		});
	},
	generateFaces: function(x, y, z, id, data) {
		if (data.type === 1) {
			if (typeof data.texture === "string") {
				/* Normal saplings with one texture */
				let texture = this.getTextureSimple(data.texture);
				let meshes = [new THREE.Mesh(this.plane,texture), new THREE.Mesh(this.plane,texture)];
				meshes[0].rotation.y = Math.PI / 4;
				meshes[1].rotation.y = -Math.PI / 4;
				meshes.forEach(mesh=>{
					mesh.position.add({
						x: x,
						y: y,
						z: z
					});
					mesh.updateMatrix();
				}
				);
				return meshes;
			} else {
				logger.warn("Unhandled creation of special block of Type 1 (Sapling Style), block id " + id.toString);
			}
		} else {
			/* Normal cube (type 0) */
			let meshes = [];
			if (typeof data.texture === "string") {
				let texture = this.getTextureSimple(data.texture);
				for (let i = 0; i < 6; i++)
					meshes.push(new THREE.Mesh(this.plane,texture));
			} else {
				let textures = [this.getTextureSimple(data.texture.front), this.getTextureSimple(data.texture.back), this.getTextureSimple(data.texture.left), this.getTextureSimple(data.texture.right), this.getTextureSimple(data.texture.top), this.getTextureSimple(data.texture.bottom)];
				for (let i = 0; i < 6; i++)
					meshes.push(new THREE.Mesh(this.plane,textures[i]));
			}
			meshes.forEach(mesh=>{
				mesh.position.add({
					x: x,
					y: y,
					z: z
				});
				mesh.updateMatrix();
			}
			);
			return meshes;
		}
	},
	getSimpleTexture: function(filename) {
		if (!this.texture[filename]) {
			this.texture[filename] = this.textureLoader.load("Images/Textures/" + filename);
			this.texture[filename].magFilter = THREE.NearestFilter;
			this.texture[filename].minFilter = THREE.LinearMipMapLinearFilter;
			//this.texture[filename].anisotropy = 0; // Proven to be unnecessary at the time
		}
		return this.texture[filename];
	},
	removeBlock: function(x, y, z) {
		let blockInfo = this.getBlockInfo(x, y, z);
		if (blockInfo) {
			let id = this.scene.children.indexOf(blockInfo.faces[0]);
			if (id !== -1) {
				let splices = 6;
				let type = blockData[blockInfo.id].type;
				if (type === 1)
					splices = 2;
				else if (type === 2)
					splices = 1;
				this.scene.children.splice(id, splices).forEach(spliced=>spliced.parent = null);
			} else {
				logger.warn("Unable to remove block because it was not found in scene");
			}
			blockInfo.faces = null;
		}
	},
	getBlockInfo: function(x, y, z) {
		if (this.blocks[y] && this.blocks[y][x] && this.blocks[y][x][z]) {
			return this.blocks[y][x][z];
		}
	},
	getBlockId: function(x, y, z) {
		let blockInfo = this.getBlockInfo(x, y, z);
		return blockInfo ? blockInfo.id : 0;
	},
	putBlockInfo: function(x, y, z, block) {
		if (!this.blocks[y])
			this.blocks[y] = [];
		if (!this.blocks[y][x])
			this.blocks[y][x] = [];
		this.blocks[y][x][z] = block;
	},
	createGlob: function(filename, globId) {
		let material = new THREE.MeshLambertMaterial({
			color: 0x555555,
			map: blocks.textureLoader.load("Images/Textures/" + filename),
			side: THREE.FrontSide
		});
		let glob = new THREE.Geometry();
		this.globs[globId] = glob;
		this.scene.add(glob);
		return glob;
	},
	createBlock: function(x, y, z, id) {
		let data = blockData[id];
		let vec = {
			x: x,
			y: y,
			z: z
		};
		if (data) {
			let textures;
			if (typeof data.texture === "string")
				textures = [data.texture, data.texture, data.texture, data.texture, data.texture, data.texture];
			else if (typeof data.texture === "object")
				textures = [data.texture.right, data.texture.left, data.texture.top, data.texture.bottom, data.texture.back, data.texture.front];
			textures.forEach(filename=>{
				globId = uniqueIdentifier.process(filename);
				let glob = this.globs[globId];
				if (!glob)
					glob = this.createGlob(filename, globId);
				let mesh = new THREE.Mesh(this.geometries.plane);
				this.sides.forEach((data,i)=>{
					meshes[i].position[data[0]] = data[1];
					meshes[i].rotation[data[2]] = data[3] * Math.PI;
				}
				);
				mesh.position.add(vec);
				glob.merge(mesh.geometry, mesh.matrix);
				glob.updateMatrix();
			}
			);
		} else {
			if (typeof logger === "object")
				logger.warn("Unhandled block id, blockData.js is missing");
		}
	}
}
