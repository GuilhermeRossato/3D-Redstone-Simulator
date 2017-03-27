var testWorld = {
	count: 0,
	init: function() {
		var texture = new THREE.Texture();
		texture.magFilter = THREE.NearestFilter;
		//this.texture.minFilter = THREE.LinearMipMapLinearFilter;
		texture.minFilter = THREE.LinearFilter;
		texture.loaded = false;
		var loader = new THREE.ImageLoader(world.textureLoader.manager);
		loader.setCrossOrigin(world.textureLoader.crossOrigin);
		loader.setWithCredentials(world.textureLoader.withCredentials);
		loader.setPath(world.textureLoader.path);
		function onLoad(image) {
			texture.loaded = true;
			texture.format = THREE.RGBAFormat;
			texture.image = image;
			texture.needsUpdate = true;
		}
		function onProgress(event) {
			console.log("progress", event);
		}
		function onError(event) {
			console.log("error", event);
		}
		var url = game.textureStitcher.result;
		loader.load(url, onLoad, onProgress, onError);
		this.texture = texture;
	},
	setUv0: function(arr) {
		if (!arr || arr.length !== 6) {
			console.log((JSON.stringify(this.mesh.geometry.faceVertexUvs[0][0])));
		} else {
			this.mesh.geometry.faceVertexUvs[0][0][0].x = arr[0];
			this.mesh.geometry.faceVertexUvs[0][0][0].y = arr[1];
			this.mesh.geometry.faceVertexUvs[0][0][1].x = arr[2];
			this.mesh.geometry.faceVertexUvs[0][0][1].y = arr[3];
			this.mesh.geometry.faceVertexUvs[0][0][2].x = arr[4];
			this.mesh.geometry.faceVertexUvs[0][0][2].y = arr[5];
			console.log((JSON.stringify(this.mesh.geometry.faceVertexUvs[0][0])));
			this.mesh.geometry.uvsNeedUpdate = true;
			this.mesh.geometry.verticesNeedUpdate = true;
		}
	},
	setTile0: function(x, y) {
		var _x = (x)/16, _y = 1-((y+1)/16), _h = 1/16, _w = 1/16;
		this.setUv0([_x,_h+_y,_x,_y,_w+_x,_h+_y])
	},
	setUv1: function(arr) {
		if (!arr || arr.length !== 6) {
			console.log((JSON.stringify(this.mesh.geometry.faceVertexUvs[0][1])));
		} else {
			this.mesh.geometry.faceVertexUvs[0][1][0].x = arr[0];
			this.mesh.geometry.faceVertexUvs[0][1][0].y = arr[1];
			this.mesh.geometry.faceVertexUvs[0][1][1].x = arr[2];
			this.mesh.geometry.faceVertexUvs[0][1][1].y = arr[3];
			this.mesh.geometry.faceVertexUvs[0][1][2].x = arr[4];
			this.mesh.geometry.faceVertexUvs[0][1][2].y = arr[5];
			console.log((JSON.stringify(this.mesh.geometry.faceVertexUvs[0][1])));
			this.mesh.geometry.uvsNeedUpdate = true;
			this.mesh.geometry.verticesNeedUpdate = true;
		}
	},
	setTile1: function(x, y) {
		var _x = x/16, _y = 1-((y+1)/16), _h = 1-15/16, _w = 1-15/16;
		testWorld.setUv1([_x,_y,_w+_x,_y,_w+_x,_h+_y])
	},
	setTile: function(x, y) {
		this.setTile0(x, y);
		this.setTile1(x, y);
	},
	createMesh: function() {
		let geometry = new THREE.PlaneGeometry(1,1,1,1);
		this.mesh = {geometry:geometry};
		//this.setUv([0.5,1,0,0,1,1]);
		//var _y = 16/16, _h = 1/16, _w = 1/16; testWorld.setUv([0,_h+_y,0,_y,_w,_h+_y])
		//geometry.faceVertexUvs[0][0][2].y = 0.5;
		//geometry.faceVertexUvs[0][0] = [new THREE.Vector2(0,0.5), new THREE.Vector2(0,0), new THREE.Vector2(0.5,0.5)];
		let material = new THREE.MeshLambertMaterial({
			map: this.texture,
			color: 0x555555
		});
		let mesh = new THREE.Mesh(geometry, material);
		game.textureStitcher.assignTextureToPlane("stone.png", geometry.faceVertexUvs[0][0], geometry.faceVertexUvs[0][1], 0)
		this.mesh = mesh;
		scene.add(mesh);
	},
	update: function() {
		if (this.count === 0)
			this.init();
		this.count++;
		if (this.texture.loaded && this.texture.loadedCount === undefined) {
			this.texture.loadedCount = this.count;
			console.log("Loaded Image at frame", this.count);
			this.createMesh();
		}
		if (this.count === this.texture.loadedCount + 60)
			this.setTile(0,0);
		else if (this.count === this.texture.loadedCount + 60*2)
			this.setTile(7,1);
		else if (this.count === this.texture.loadedCount + 60*3)
			this.setTile(14,2);
		else if (this.count === this.texture.loadedCount + 60*4)
			this.setTile(14,3);
		else if (this.count === this.texture.loadedCount + 60*5)
			this.setTile(14,0);

	}
}

function placePlayer(x, y, z) {
	x = x || -32;
	y = y || 11;
	z = z || 32;

	player.controls.player.position.set(x, y, z);
	player.controls.player.rotation.y = -0.772;
	player.controls.player.children[0].rotation.x = -0.523
}
