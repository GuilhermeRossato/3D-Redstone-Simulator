function CollisionController(scene) {
	this.raycaster = new THREE.Raycaster(undefined,new THREE.Vector3(0,1,0),0,1);
	this.raycaster.near = 0;
	this.sceneChildren = scene.children;
	this.updateCollisionBoundingRect();
}
CollisionController.prototype = {
	constructor: CollisionController,
	check: function(axisString, position, axisSpeed, multiplier) {
		this.limit = 0;
		var distance = Math.max(0.01,Math.abs(axisSpeed * multiplier));
		var direction = axisSpeed > 0 ? 1 : -1;
		var minValue = Number.MAX_VALUE;
		var minId = -1;
		this.raycaster.far = distance;
		var addVec = {x:0,z:0}
		if (axisString == "X") {
			this.raycaster.ray.direction.set(direction, 0, 0);
			addVec.x = direction*options.collisionBoundingRect.horizontal;
		} else {
			this.raycaster.ray.direction.set(0, 0, direction);
			addVec.z = direction*options.collisionBoundingRect.horizontal;
		}
		minId = -1;
		//[{x:0,y:0,z:0}].forEach((vec,id)=>{
		var quadsSelected = this["quad"+axisString];
		quadsSelected.forEach((vec,id)=>{
			this.raycaster.ray.origin.set(position.x + vec.x + addVec.x, position.y + vec.y, position.z + vec.z + addVec.z);
			if (axisString == "Z") {
			//	this.raycaster.ray.origin.z += direction;
			}
			let inter = this.raycaster.intersectObjects(this.sceneChildren);
			if (inter.length > 0) {
				if (minValue > inter[0].distance) {
					minValue = inter[0].distance;
					minId = id;
				}
			}
		}
		);
		this.limit = (minId >= 0) ? minValue*direction : 0;
		this.limitId = minId;
		return (minId == -1);
	},
	checkZ: function() {
		return false;
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
		//this.quadZ = [];
		//this.quadZ.push({x:h,y:-v,z:0});
		//this.quadZ.push({x:-h,y:-v,z:0});
	},
	checkY: function(position, direction, distance) {
		var minValue = Number.MAX_VALUE;
		var minId = -1;
		this.raycaster.far = Math.abs(direction * distance);
		this.raycaster.ray.direction.set(0, -direction, 0);
		this.quadY.forEach((vec,id)=>{
			this.raycaster.ray.origin.set(position.x + vec.x, position.y - direction * options.collisionBoundingRect.vertical + vec.y, position.z + vec.z);
			let inter = this.raycaster.intersectObjects(this.sceneChildren);
			if (inter.length > 0) {
				if (minValue > inter[0].distance) {
					minValue = inter[0].distance;
					minId = id;
				}
			}
		}
		);
		this.limitY = (minId >= 0) ? minValue*direction : 0;
		this.limitId = minId;
		return (minId == -1) ;
	}
}
function putp(x, y) {
	controls.player.position.x = b(-0.05, 0.05, x);
	controls.player.position.z = b(-6.05, -5.95, y);
}
