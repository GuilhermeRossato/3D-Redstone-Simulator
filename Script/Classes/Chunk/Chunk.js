function Chunk(x, y, z, scene, material) {
	this.meshRecreation = true;
	this.disableMeshRecreation = function() {
		this.meshRecreation = false;
	}
	this.enableMeshRecreation = function() {
		this.meshRecreation = true;
	}
	this.material = material;
	if (!material)
		throw "rock";
	else
		this.createMesh(scene);
}

var counting = 0;

Chunk.prototype = {
	constructor: Chunk,
	createMesh: function(scene) {
		this.geometry = new THREE.Geometry();
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		scene.add(this.mesh);
	},
	recreateMesh: function() {
		this.dirty = false;
		let geo = new THREE.Geometry();
		geo.vertices = this.geometry.vertices;
		geo.faces = this.geometry.faces;
		geo.faceVertexUvs = this.geometry.faceVertexUvs;
		this.geometry.dispose();
		this.geometry.vertices = undefined;
		this.geometry.faces = undefined;
		this.geometry.boundingSphere = undefined;
		this.geometry = geo;
		this.geometry.boundingSphere = null;
		this.mesh.geometry = this.geometry;
	},
	addMesh: function(mesh) {
		counting ++;
		//console.log(mesh.position, counting);
		mesh.updateMatrix();
		this.geometry.merge(mesh.geometry, mesh.matrix);
		if (this.geometry.boundingSphere) {
			if (this.meshRecreation)
				this.recreateMesh();
			else
				this.dirty = true;
		}
		//this.mesh.updateMatrix();
		//return 
	}
}