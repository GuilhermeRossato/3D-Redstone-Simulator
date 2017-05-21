/*
 * This class handles block placement in the world, handling visibility and assiging textures, materials and geometry to faces.
 *
 * @TextureLoader
 * @author: Guilherme Rossato
 *
*/
function WorldHandler(scene) {
	this.loader = new WorldLoader(this);
	this.saver = new WorldSaver(this);
	this.scene = scene;
	this.blocks = [];
	this.blockList = [];
	this.allFaces = [];
	this.faces = [];
}

WorldHandler.prototype = {
	constructor: WorldHandler,
	loadBegin: function() {
		this.textures = new TextureHandler(this);
		this.textures.parseBlockList(blockData);
	},
	loadStep: function() {
		let p = this.textures.getProgress();
		return new LoadStatus("TextureHandler", "Loading Textures", Math.min(p, 1));
	},
	loadEnd: function() {
		this.generateGeometries();
		this.generate();
	},
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
	},
	getBlockList: function() {
		return this.blockList;
	},
	sidesDisplacement: [
		["z", 0.5, "y", 0],		// 0 Front
		["z", -0.5, "y", 1],	// 1 Back
		["x", 0.5, "y", 0.5],	// 2 Right
		["x", -0.5, "y", -0.5],	// 3 Left
		["y", 0.5, "x", -0.5],	// 4 Top
		["y", -0.5, "x", 0.5]	// 5 Bottom
	],
	facesDisplacement: [[0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0]],
	generate: function() {
		let world = this;
		let size = 32;
		//repeat(size, (i)=>{repeat(size, (k)=>{world.setBlock(i-16, 0, k-16, 1);});});
		let blockList = this.loader.decideFileTypeByData(worldData);
		blockList.forEach(block => {
			world.setBlock(block.x, block.y, block.z, block.id);
		});
	},
	generateMinecraftLikeTerrain() {
		// Manual but CPU intensive!
		let world = this;
		let size = 32;
		function isSolidSpace(x, y, z) {
			return (y <= 0) || ((noise.perlin3((x+4)/16, (y)/16, (z-8)/16)+1)*10 > (y+7));
		}
		let counter = 0;
		repeat(size, (i)=>{
			repeat(size, (k)=>{
				repeat(25, (j)=> {
					if (isSolidSpace(i, j, k) && (!isSolidSpace(i, j, k+1) || !isSolidSpace(i, j, k-1) || !isSolidSpace(i+1, j, k) || !isSolidSpace(i-1, j, k) || !isSolidSpace(i, j+1, k) || !isSolidSpace(i, j-1, k))) {
						world.setBlock(i-size/2, j, k-size/2, 1);
						counter++;
					}
				});
			});
		});
		console.log("Created",counter,"blocks manually");
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
		this.sidesDisplacement.forEach((cmd,i)=>{
			faces[i].position.set(x, y, z);
			faces[i].position[cmd[0]] += cmd[1];
			faces[i].rotation[cmd[2]] = cmd[3] * Math.PI;
		}
		);
	},
	getSimpleTexture: function(fileName, transparent) {
		let texture = this.textures.getTexture(fileName);
		if (transparent)
			texture.transparent = true;
		return texture;
	},
	generateFaces: function(x, y, z, id, data) {
		if (data.type === blockTypes.topSlab || data.type === blockTypes.bottomSlab) {
			let faces = this.generateFaces(x, y, z, id, {
				type: 0,
				texture: data.texture
			});
			faces.forEach((obj,i)=>{
				if (i < 4) {
					obj.geometry = this.geometries.half;
					obj.position.y += (data.type === blockTypes.topSlab) ? 0.25 : -0.25;
				} else if (i === 4 && data.type !== blockTypes.topSlab) {
					obj.position.y -= 0.5;
				} else if (i === 5 && data.type === blockTypes.topSlab) {
					obj.position.y += 0.5;
				}
			}
			);
			return faces;
		} else if (data.type === blockTypes.sapling) {
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
				let faceMeshes = this.generateFaces(x, y, z, id, bd);
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
				faceMeshes.forEach(face => face.blockId = id);
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
	removeBlock: function(x, y, z) {
		let blockInfo = this.getBlockInfo(x, y, z);
		if (blockInfo && blockInfo.faces) {
			let blockListIndex = this.blockList.indexOf(blockInfo);
			if (blockListIndex !== -1)
				this.blockList.splice(blockListIndex, 1);
			else
				console.warn("Block to be removed not found on main block list");
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
				logger.warn("Unable to remove face, it was not found in the world");
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
		block.x = x;
		block.y = y;
		block.z = z;
		this.blockList.push(block);
		this.blocks[y][x][z] = block;
	},
	update: function() {}
}
