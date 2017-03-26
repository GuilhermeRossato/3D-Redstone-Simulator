function WorldHandler(scene) {
	this.loader = new WorldLoader(this);
	this.saver = new WorldSaver(this);
	this.scene = scene;
	this.blocks = [];
	this.allFaces = [];
	this.faces = [];
	this.textures = {};
	this.generateGeometries();
	this.textureLoader = new THREE.TextureLoader();
	this.generate();
}

WorldHandler.prototype = {
	constructor: WorldHandler,
	lastBlockDetails: {
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
	},
	generateGeometries: function() {
		this.geometries = {
			plane: new THREE.PlaneGeometry(1,1,1,1),
			half: new THREE.PlaneGeometry(1,0.5,1,1),
			quarter: new THREE.PlaneGeometry(1,0.25,1,1)
		}
		this.geometries.half.faceVertexUvs[0][1][2].set(1, 0.5);
		this.geometries.half.faceVertexUvs[0][0][2].set(1, 0.5);
		this.geometries.half.faceVertexUvs[0][0][0].set(0, 0.5);
	},
	getBlockList: function() {
		var allBlocks = [];
		this.blocks.forEach((x_axis,x)=>{
			x_axis.forEach((z_axis,x)=>{
				z_axis.forEach((y_axis,y)=>{
					allBlocks.push(y_axis);
				}
				);
			}
			);
		}
		);
		return allBlocks;
	},
	sidesDisplacement: [["z", 0.5, "y", 0], // Front (0)
	["z", -0.5, "y", 1], // Back (1)
	["x", 0.5, "y", 0.5], // Right (2)
	["x", -0.5, "y", -0.5], // Left (3)
	["y", 0.5, "x", -0.5], // Top (4)
	["y", -0.5, "x", 0.5]// Down (5)
	],
	facesDisplacement: [[0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0]],
	generate: function() {
		let world = this;
		let size = 20;
		repeat(size, (i)=>{
			repeat(size, (j)=>{
				world.setBlock(i - size / 2, 0, j - size / 2, 1);
			}
			);
		}
		);
		world.setBlock(3, 2, 6, 6);
		world.setBlock(3, 2, 7, 4);
		world.setBlock(4, 2, 6, 4);
		world.setBlock(5, 1, 6, 43);
		world.setBlock(6, 2, 6, 203);
		world.setBlock(6, 3, 6, 203);
		world.setBlock(6, 2, 7, 4);
		world.setBlock(6, 6, 6, 204);
		world.setBlock(6, 6, 7, 98);
		world.setBlock(6, 6, 9, 98);
		repeat(4, i=>{
			world.setBlock(3, i + 1, 1, 98);
			world.setBlock(3, i + 1, 0, 98);
			if (i < 3) {
				world.setBlock(-2, 1, i, 98);
				world.setBlock(-2, 2, i, 98);
			}
		}
		);
	},
	setTouchingFacesVisibility: function(x, y, z, ownFaces, state) {
		this.facesDisplacement.forEach((obj,i)=>{
			let face = this.getFace(x + obj[0], y + obj[1], z + obj[2], i);
			if (face && !face.transparent) {
				face.visible = state;
				i = [1, 0, 3, 2, 5, 4][i];
				if (ownFaces && ownFaces[i])
					ownFaces[i].visible = false;
			}
		}
		);
	},
	hideTouchingFaces: function(x, y, z, ownFaces) {
		this.setTouchingFacesVisibility(x, y, z, ownFaces, false);
	},
	showTouchingFaces: function(x, y, z, ownFaces) {
		this.setTouchingFacesVisibility(x, y, z, ownFaces, true);
	},
	setBlock: function(x, y, z, id) {
		if (!this.lastBlockDetails.match(x, y, z, id)) {
			this.lastBlockDetails.set(x, y, z, id);
			if (this.getBlockId(x, y, z)) {
				this.removeBlock(x, y, z);
			}
			if (id === 0)
				return
			let bd = blockData[id];
			if (bd) {
				let blockInfo = {
					blockData: bd,
					id: id,
					x: x,
					y: y,
					z: z
				}
				let faces = this.generateFaces(x, y, z, id, bd);
				faces.forEach(face=>face.blockInfo = blockInfo);
				if (!bd.transparent) {
					this.hideTouchingFaces(x, y, z, faces);
				} else {
					faces.forEach(face=>face.transparent = true);
					blockInfo.transparent = true;
				}
				this.putFacesIntoWorld(x, y, z, faces);
				blockInfo.faces = faces;
				this.putBlockInfo(x, y, z, blockInfo);
			} else {
				logger.warn("No render info for block id " + id.toString());
			}
		}
	},
	putFacesIntoWorld: function(x, y, z, faces) {
		if (!this.faces[y])
			this.faces[y] = [];
		if (!this.faces[y][x])
			this.faces[y][x] = [];
		this.faces[y][x][z] = faces;
		faces.forEach((face,i)=>{
			face.direction = i;
			this.allFaces.push(face);
			this.scene.add(face);
		}
		);
	},
	getFace: function(x, y, z, side) {
		if (this.faces[y] && this.faces[y][x] && this.faces[y][x][z])
			return this.faces[y][x][z][side];
	},
	generateFaces: function(x, y, z, id, data) {
		if (data.type === 6 || data.type === 7) {
			let faces = this.generateFaces(x, y, z, id, {
				type: 0,
				texture: data.texture
			});
			faces.forEach((obj,i)=>{
				if (i < 4) {
					obj.geometry = this.geometries.half;
					obj.position.y += (data.type === 7) ? 0.25 : -0.25;
				} else if (i === 4 && data.type === 6) {
					obj.position.y -= 0.5;
				} else if (i === 5 && data.type === 7) {
					obj.position.y += 0.5;
				}
			}
			);
			return faces;
		} else if (data.type === 1) {
			if (typeof data.texture === "string") {
				/* Normal saplings with one texture */
				let texture = this.getSimpleTexture(data.texture, true);
				texture.side = THREE.DoubleSide;
				let meshes = [new THREE.Mesh(this.geometries.plane,texture), new THREE.Mesh(this.geometries.plane,texture)];
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
			/* Normal solid cube (type 0) */
			let meshes = [];
			if (typeof data.texture === "string") {
				let texture = this.getSimpleTexture(data.texture);
				for (let i = 0; i < 6; i++)
					meshes.push(new THREE.Mesh(this.geometries.plane,texture));
			} else {
				let textures = [this.getSimpleTexture(data.texture.front), this.getSimpleTexture(data.texture.back), this.getSimpleTexture(data.texture.left), this.getSimpleTexture(data.texture.right), this.getSimpleTexture(data.texture.top), this.getSimpleTexture(data.texture.bottom)];
				for (let i = 0; i < 6; i++)
					meshes.push(new THREE.Mesh(this.geometries.plane,textures[i]));
			}
			this.sidesDisplacement.map((info,i)=>{
				let mesh = meshes[i];
				mesh.position[info[0]] = info[1];
				mesh.rotation[info[2]] = info[3] * Math.PI;
				return mesh;
			}
			);

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
	getSimpleTexture: function(filename, transparent) {
		if (!this.textures[filename]) {
			let texture = this.textureLoader.load("Images/Textures/" + filename);
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.LinearMipMapLinearFilter;
			//texture.anisotropy = 0; // Proven to be unnecessary at the time
			let material = new THREE.MeshLambertMaterial({
				map: texture,
				transparent: transparent ? true : false,
				color: 0x555555
			});
			this.textures[filename] = material;
		}
		return this.textures[filename];
	},
	removeBlock: function(x, y, z) {
		let blockInfo = this.getBlockInfo(x, y, z);
		if (blockInfo) {
			this.showTouchingFaces(x, y, z);
			let id = this.scene.children.indexOf(blockInfo.faces[0]);
			let id2 = this.allFaces.indexOf(blockInfo.faces[0]);
			if (id !== -1) {
				let splices = 6;
				let type = blockData[blockInfo.id].type;
				if (type === 1)
					splices = 2;
				else if (type === 2)
					splices = 1;

				this.scene.children.splice(id, splices).forEach(spliced=>spliced.parent = null);
				if (id2 !== -1)
					this.allFaces.splice(id, splices);
				this.blocks[y][x][z] = null;
				this.faces[y][x][z] = null;
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
	update: function() {}
}
