function WorldHandler2(scene, textureStitcher) {
	this.scene = scene;
	this.textureStitcher = textureStitcher;
	this.textureSize = textureStitcher.tilesHorizontally;
	this.loadTexture();
	this.fullMesh = new THREE.Mesh(new THREE.PlaneGeometry(1,1,1,1));
	this.halfMesh = new THREE.Mesh(new THREE.PlaneGeometry(1,0.5,1,1));
	this.quarterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1,0.25,1,1));
	this.chunks = [];
}

WorldHandler2.prototype = {
	constructor: WorldHandler2,
	sidesDisplacement: [["z", 0.5, "y", 0], // Front (0)
	["z", -0.5, "y", 1], // Back (1)
	["x", 0.5, "y", 0.5], // Right (2)
	["x", -0.5, "y", -0.5], // Left (3)
	["y", 0.5, "x", -0.5], // Top (4)
	["y", -0.5, "x", 0.5]// Bottom (5)
	],
	createChunkMaterial: function(texture, image) {
		texture.format = THREE.RGBAFormat;
		texture.image = image;
		texture.needsUpdate = true;
		this.chunkMaterial = new THREE.MeshLambertMaterial({
			map: texture,
			color: 0x555555
		});
	},
	loadTexture: function() {
		let textureLoader = new THREE.TextureLoader();
		let texture = new THREE.Texture();
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.LinearFilter;
		var loader = new THREE.ImageLoader(textureLoader.manager);
		loader.setCrossOrigin(textureLoader.crossOrigin);
		loader.setWithCredentials(textureLoader.withCredentials);
		loader.setPath(textureLoader.path);
		function onError(err) {
			console.error("Error loading texture: ", err);
		}
		var url = game.textureStitcher.result;
		loader.load(url, (image)=>this.createChunkMaterial(texture, image), undefined, onError);
		this.texture = texture;
	},
	getValidChunk: function(x, y, z) {
		x = x / 16 | 0;
		y = y / 16 | 0;
		z = z / 16 | 0;
		if (!this.chunks[y])
			this.chunks[y] = [];
		if (!this.chunks[y][x])
			this.chunks[y][x] = [];
		if (!this.chunks[y][x][z])
			this.chunks[y][x][z] = new Chunk(x,y,z,this.scene,this.chunkMaterial);
		return this.chunks[y][x][z];
	},
	positionFace: function(mesh, sideData, x, y, z) {
		mesh.position.set(x, y, z);
		mesh.position[sideData[0]] += sideData[1];
		mesh.rotation.set(0, 0, 0);
		mesh.rotation[sideData[2]] = sideData[3]*Math.PI;
	},
	setFaceTexture: function(mesh, vec, type) {
		/* Remember: to draw things like slabs and crucibles, face texture must be set differently! */
		if (type == blockTypes.simple) {
			//var _x = (x)/16, _y = 1-((y+1)/16), _h = 1/16, _w = 1/16;
			//this.setUv0([_x,_h+_y,_x,_y,_w+_x,_h+_y])
			let faceVertex0 = mesh.geometry.faceVertexUvs[0][0]
			  , faceVertex1 = mesh.geometry.faceVertexUvs[0][1]
			  , x = vec.x
			  , y = vec.y
			  , size = this.textureSize;
			faceVertex0[0].x = x / size;
			faceVertex0[0].y = 1 / size + (1 - ((y + 1) / size));
			// (size+2-y)/size;
			faceVertex0[1].x = x / size;
			faceVertex0[1].y = 1 - ((y + 1) / size);
			faceVertex0[2].x = (1 + x) / size;
			faceVertex0[2].y = 1 / size + (1 - (y + 1) / size);
			faceVertex1[0].x = x / size;
			faceVertex1[0].y = 1 - (y + 1) / size;
			// (size+2-y)/size;
			faceVertex1[1].x = (1 + x) / size;
			faceVertex1[1].y = (15 - y) / size;
			faceVertex1[2].x = 1 / size + x / size;
			faceVertex1[2].y = 1 / size + (1 - (y + 1) / size);
		}
	},
	setBlock: function(x, y, z, id) {
		let chunk = this.getValidChunk(x, y, z);
		let data = blockData[id];
		if (!data) {
			console.warn("Unable to set unimplemented block of id:", id);
			return
		}
		if (data.type === blockTypes.simple) {
			let textureType = typeof data.texture;
			if (textureType === "string") {
				let texturePosition = this.textureStitcher.getTexturePosition(data.texture);
				this.sidesDisplacement.forEach((sideData,i)=>{
					this.positionFace(this.fullMesh, sideData, x, y, z);
					this.setFaceTexture(this.fullMesh, texturePosition, data.type);
					chunk.addMesh(this.fullMesh);
				});

			} else if (textureType === "object") {
				let texturePositions = ["front", "back", "right", "left", "top", "bottom"].map((textureName)=>this.textureStitcher.getTexturePosition(textureName));
				this.sidesDisplacement.forEach((sideData,i)=>{
					this.positionFace(this.fullMesh, sideData, x, y, z);
					this.setFaceTexture(this.fullMesh, texturePositions[i], data.type);
					chunk.addMesh(this.fullMesh);
				});
			}
		}
	},
	removeBlock: function(x, y, z, id) {}
}
