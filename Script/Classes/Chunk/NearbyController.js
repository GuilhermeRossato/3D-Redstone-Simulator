function NearbyController(parent) {
	this.positive = [];
	this.negative = [];
	this.state = 0;
	this.progress = 0;
	this.lastStop = 0;
	this.toggleSpan = 32;
	this.position = new THREE.Vector3(0,2,0);
	this.parent = parent;
}
NearbyController.prototype = {
	constructor: NearbyController,
	toggle: function(x, y, z) {
		if (typeof x !== "number" || typeof y !== "number" || typeof z != "number") {
			if (typeof logger === "object")
				logger.warn("Incorrect parameters for nearby blocks toggling");
			return false;
		}
		x = x | 0;
		y = y | 0;
		z = z | 0;
		if (this.position.x !== x || this.position.y !== y || this.position.z !== z) {
			this.position.set(x, y, z);
			this.progress = 0;
			this.lastStop = 0;
			if (this.state === 0) {
				this.negative = undefined;
				this.state = 1;
				this.negative = [];
			} else {
				this.positive = undefined;
				this.state = 0;
				this.positive = [];
			}
			return true;
		}
		return false;
	},
	update: function(x, y, z) {
		/*this.toggle(x, y, z);
		var list, mesh, realPos;
		list = this.get();
		this.parent.blocks.forEach(block=>{
			mesh = block.mesh;
			realPos = mesh.realPosition;
			if (this.isInside(realPos.x, realPos.y, realPos.z))
				list.push(mesh);
		});*/
	},
	get: function() {
		return (this.state === 0) ? this.negative : this.positive;
	},
	isInside: function(x, y, z) {
		x = x - this.position.x;
		y = y - this.position.y;
		z = z - this.position.z;
		return (x >= -5 && x <= 5 && y >= -5 && y <= 5 && z >= -5 && z <= 5);
	},
	toId: function(x, y, z) {
		x = x - this.position.x + 5;
		y = y - this.position.y + 5;
		z = z - this.position.z + 5;
		if (x >= 0 && x < 11 && y >= 0 && y < 11 && z >= 0 && z < 11) {
			return x + y * 11 + z * 11 * 11;
		} else {
			return -1;
		}
	},
	fromId: function(id) {
		return {
			x: id % 11 + this.position.x - 5,
			y: ((id / 11) | 0) % 11 + this.position.y - 5,
			z: ((id / (11 * 11)) | 0) % 11 + this.position.z - 5
		}
	}
}
