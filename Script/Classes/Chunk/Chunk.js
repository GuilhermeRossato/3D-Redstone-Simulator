function Chunk(x, y, z, scene, material) {
	this.centerMesh = function() {
		this.mesh.geometry.boundingSphere.center.set(x, y, z);
	}
	if (!material)
		throw "rock";
	else
		this.createMesh(scene, material);
}

Chunk.prototype = {
	constructor: Chunk,
	createMesh: function(scene, material) {
		this.geometry = new THREE.Geometry();
		this.mesh = new THREE.Mesh(this.geometry, material);
		//this.centerMesh();
		scene.add(this.mesh);
	},
	addMesh: function(mesh) {
		mesh.updateMatrix();
		this.geometry.merge(mesh.geometry, mesh.matrix);
		this.mesh.updateMatrix();
	}
}