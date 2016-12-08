function MeshController() {
	this.meshes = [];
}
MeshController.prototype = {
	constructor: MeshController,
	getMesh: function(id) {
		return this.meshes.filter((obj)=>obj.id === id)[0] || 0;
	},
	justAddMesh: function(id, data) {
		this.meshes.push({
			id: id,
			data: data
		});
	},
	addMesh: function(id, data) {
		var obj = this.getMesh(id);
		if (typeof obj !== "object" && id !== 0) {
			this.justAddMesh(id, data);
			return true;
		}
		return false;
	}
}
