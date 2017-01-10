function CollisionController(scene) {
	this.raycaster = new THREE.Raycaster(undefined,new THREE.Vector3(0,1,0),0,1);
	this.raycaster.near = 0;
	this.sceneChildren = scene.children;
	this.updateCollisionBoundingRect();
}
CollisionController.prototype = {
	constructor: CollisionController,
	check: function(position, quad, direction, distance, boundingBoxLength) {
		var minValue = Number.MAX_VALUE;
		var minId = -1;
		this.raycaster.far = distance;
		this.raycaster.ray.direction.copy(direction);
		quad.forEach((vec,id)=>{
			this.raycaster.ray.origin.set(position.x + vec.x + direction.x * boundingBoxLength,
										  position.y + vec.y + direction.y * boundingBoxLength,
										  position.z + vec.z + direction.z * boundingBoxLength);
			let inter = this.raycaster.intersectObjects(this.sceneChildren);
			if (inter.length > 0) {
				if (minValue > inter[0].distance) {
					minValue = inter[0].distance;
					minId = id;
				}
			}
		}
		);
		this.limit = (minId >= 0) ? minValue*(direction.x+direction.y+direction.z) : 0;
		this.limitId = minId;
		return (minId == -1);
	},
	updateCollisionBoundingRect: function() {
		var h = options.collisionBoundingRect.horizontal;
		var v = options.collisionBoundingRect.vertical;
		if (h > 0.5 || v > 0.5)
			console.warn("Warning: CollisionBoundingRect too large, you might not always work");
		var quad = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
		this.quadY = quad.map((obj,id)=>{
			return {
				x: (obj[0]) * h + ((id == 1 || id == 2) ? 0.001 : -0.001),
				y: 0,
				z: (obj[1]) * h + ((id > 1) ? 0.001 : -0.001)
			}
		}
		);
		this.quadX = quad.map((obj,id)=>{
			return {
				x: 0,
				y: obj[1] * v + ((id > 1) ? 0.001 : -0.001),
				z: obj[0] * h + ((id == 1 || id == 2) ? 0.001 : -0.001)
			}
		}
		);
		this.quadZ = quad.map((obj,id)=>{
			return {
				x: obj[0] * h + ((id == 1 || id == 2) ? 0.001 : -0.001),
				y: obj[1] * v + ((id > 1) ? 0.001 : -0.001),
				z: 0
			}
		}
		);
	}
}
function putp(x, y) {
	controls.player.position.x = b(-0.05, 0.05, x);
	controls.player.position.z = b(-6.05, -5.95, y);
}
