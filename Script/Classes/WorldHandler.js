function WorldHandler(scene, textureStitcher) {
	this.loader = new WorldLoader(this);
	this.saver = new WorldSaver(this);
	this.textureStitcher = textureStitcher;
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
	loadPrepare: function() {
		this.loadTexture();
	},
	loadStep: function(timeStamp) {
		if (this.material) {
			this.loadFinish();
			return new LoadStatus("WorldHandler","Done",1);
		} else if (this.texture) {
			return new LoadStatus("WorldHandler","Creating Material",0.5);
		} else {
			this.loadTexture();
			return new LoadStatus("WorldHandler", "Loading Texture", 0)
		}
	},
	loadFinish: function() {
		this.generate();
	},
	createMaterial: function(texture, image) {
		texture.format = THREE.RGBAFormat;
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.LinearMipMapLinearFilter;
		texture.image = image;
		texture.needsUpdate = true;
		this.material = new THREE.MeshLambertMaterial({
			map: texture,
			color: 0x555555
		});
	},
	loadTexture: function() {
		let texture = new THREE.Texture();
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.LinearFilter;
		var loader = new THREE.ImageLoader(this.textureLoader.manager);
		loader.setCrossOrigin(this.textureLoader.crossOrigin);
		loader.setWithCredentials(this.textureLoader.withCredentials);
		loader.setPath(this.textureLoader.path);
		function onError(err) {
			console.error("Error loading texture: ", err);
		}
		var url = game.textureStitcher.result;
		if (url)
			loader.load(url, (image)=>this.createMaterial(texture, image), undefined, onError);
		else
			this.material = null;
		this.texture = texture;
	},
	generateGeometries: function() {
		this.geometries = {
			plane: new THREE.PlaneGeometry(1,1,1,1),
			half: new THREE.PlaneGeometry(1,0.5,1,1),
			quarter: new THREE.PlaneGeometry(1,0.25,1,1)
		}
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
	["y", -0.5, "x", 0.5]// Bottom (5)
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
		world.setBlock(0, 0, 0, 0);
		world.setBlock(0, 1, 0, 0);
		world.setBlock(1, 0, 0, 0);
		world.setBlock(-1, 0, 0, 0);
		world.setBlock(0, 0, 1, 0);
		world.setBlock(0, 0, -1, 0);
		world.setBlock(0, 0, 0, 0);
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
	positionFaces: function(x, y, z, faces, data) {
		//if (data.type === undefined) {
		this.sidesDisplacement.forEach((cmd,i)=>{
			faces[i].position.set(x, y, z);
			faces[i].position[cmd[0]] += cmd[1];
			faces[i].rotation[cmd[2]] = cmd[3] * Math.PI;
		}
		);
		//}
	},
	generateFaces: function(data) {
		//if (data.type === undefined) {
		let geometries = [];
		repeat(6, ()=>geometries.push(new THREE.PlaneGeometry(1,1,1,1)));
		if (typeof data.texture === "string") {
			geometries.forEach(geo=>this.textureStitcher.putTextureInFace(geo, data.texture, 0));
		} else {
			["front", "back", "right", "left", "top", "bottom"].forEach((side,i)=>this.textureStitcher.putTextureInFace(geometries[i], data.texture[side], 0));
		}
		return geometries;
		//}
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
				let facesGeometries = this.generateFaces(bd);
				if (facesGeometries) {
					let faceMeshes = facesGeometries.map(geometry=>new THREE.Mesh(geometry,this.material));
					this.positionFaces(x, y, z, faceMeshes, bd);
					if (bd.type === blockTypes.glass || bd.type === blockTypes.sapling || bd.type === blockTypes.topSlab || bd.type === blockTypes.bottomSlab) {
						faceMeshes.forEach(mesh=>mesh.transparent = true);
					} else {
						this.hideTouchingFaces(x, y, z, faceMeshes);
					}
					this.putFacesIntoWorld(x, y, z, faceMeshes);
					let blockInfo = {
						id: id,
						blockData: bd,
						faces: faceMeshes
					};
					faceMeshes.forEach(face => face.blockInfo = blockInfo);
					this.putBlockInfo(x, y, z, blockInfo);
				} else {
					logger.warn("No face setup for block id " + id.toString());
				}
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
	removeBlock: function(x, y, z) {
		let blockInfo = this.getBlockInfo(x, y, z);
		if (blockInfo) {
			this.showTouchingFaces(x, y, z);
			let sceneIndex = this.scene.children.indexOf(blockInfo.faces[0]);
			let facesIndex = this.allFaces.indexOf(blockInfo.faces[0]);
			if (sceneIndex !== -1) {
				let splices = 6;
				/*
				let type = blockData[blockInfo.id].type;
				if (type === 1)
					splices = 2;
				else if (type === 2)
					splices = 1;
				*/
				this.scene.children.splice(sceneIndex, splices).forEach(spliced=>spliced.parent = null);
				if (facesIndex !== -1)
					this.allFaces.splice(facesIndex, splices);
				blockInfo.faces = undefined;
				this.blocks[y][x][z] = undefined;
				this.faces[y][x][z] = undefined;
			} else {
				blockInfo.faces = undefined;
				logger.warn("Unable to remove block because it was not found in the world");
			}
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
