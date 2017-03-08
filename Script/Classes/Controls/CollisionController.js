function CollisionController(parent, scene, size) {
	this.parent = parent;
	this.scene = scene;
	this.size = size;
	this.enabled = true;
	this.updateCollisionBoundingRect();
	this.collisionHelpers = [];
	["Y0", "Y1", "Y2", "Y3", "X0", "X1", "X2", "X3", "Z0", "Z1", "Z2", "Z3"].forEach(()=>{
		let sh = new SpacialHighlight(scene,0xFFFFFF,0.1);
		sh.position.set(Math.random() - 0.5, 0.5 + Math.random(), Math.random() - 0.5);
		sh.show();
		this.collisionHelpers.push(sh);
	}
	);
}

var valueSet = 1.45;

CollisionController.prototype = {
	constructor: CollisionController,
	initiateBoundingBox: function(position) {
		this.boundingBox = new MinecraftSelection(this.scene);
		this.boundingBox.copySize(this.size);
		this.boundingBox.setColor(0xFF2255);
		this.boundingBox.position.copy(position);
	},
	showBoundingBox: function(position) {
		if (!this.boundingBox)
			this.initiateBoundingBox(position);
		this.boundingBox.show();
	},
	hideBoundingBox: function() {
		if (this.boundingBox)
			this.boundingBox.hide();
	},
	step: function(position, direction, speed) {
		if (!this.enabled)
			return;
		if (this.boundingBox)
			this.boundingBox.position.copy(position);
		let velocity = new THREE.Vector3(direction.x * speed.x,direction.y * speed.y,direction.z * speed.z);
		if (direction.y !== 0) {
			let midSize = this.size.y / 2 * ((direction.y < 0) ? -1 : 1);
			let collidingFace, origin;
			origin = new THREE.Vector3();
			this.quadY.forEach((quad,i)=>{
				origin.set(quad.x, quad.y + velocity.y, quad.z);
				origin.add(position);
				origin.add({
					x: 0.5,
					y: ((direction.y < 0) ? 0.125 : 0.875) + midSize,
					z: 0.5
				});
				origin.floor();
				//this.collisionHelpers[i].position.copy(origin);
				//this.collisionHelpers[i].show();
				let face = world.getFace(origin.x | 0, origin.y | 0, origin.z | 0, (direction.y < 0) ? 4 : 5);
				if (face) {
					if (!collidingFace || (direction.y > 0 && collidingFace && collidingFace.position.y > face.position.y) || (direction.y < 0 && collidingFace && collidingFace.position.y < face.position.y))
						collidingFace = face;
				}
			}
			);
			if (collidingFace) {
				let facePos = collidingFace.position.y - midSize;
				if ((direction.y > 0 && position.y + velocity.y >= facePos && position.y <= facePos) || (direction.y < 0 && position.y + velocity.y <= facePos && position.y >= facePos)) {
					velocity.y = 0;
					position.y = facePos;
				}
			}
		}
		if (direction.x !== 0) {
			let midSize = this.size.x / 2 * ((direction.x < 0) ? -1 : 1);
			let collidingFace, origin;
			origin = new THREE.Vector3();
			this.quadX.forEach((quad,i)=>{
				origin.set(quad.x + velocity.x, quad.y, quad.z);
				origin.add(position);
				origin.add({
					x: 0.5 + midSize * 2,
					y: 0.5,
					z: 0.5
				});
				if (i > 3) {
					this.collisionHelpers[i].setColor(0xFF0000);
					origin.y += ((i===4)?0.25:-0.25);
				}
				origin.floor();
				this.collisionHelpers[i].position.copy(origin);
				this.collisionHelpers[i].show();
				let face = world.getFace(origin.x | 0, origin.y | 0, origin.z | 0, ((direction.x < 0) ? 2 : 3));
				if (face && face.blockInfo.type !== 1) {
					if (!collidingFace || (direction.x > 0 && collidingFace && collidingFace.position.x < face.position.x) || (direction.x < 0 && collidingFace && collidingFace.position.x > face.position.x))
						collidingFace = face;
				}
			}
			);
			if (collidingFace && true) {
				let stop = false;
				let facePos = collidingFace.position.x - midSize;
				if ((position.x + velocity.x <= facePos && position.x >= facePos) || (position.x + velocity.x >= facePos && position.x <= facePos)) {
					velocity.x = 0;
					position.x = facePos;
				}
			}
		}
		if (direction.z !== 0) {
			let midSize = this.size.z / 2 * ((direction.z < 0) ? -1 : 1);
			let collidingFace, origin;
			origin = new THREE.Vector3();
			this.quadZ.forEach((quad,i)=>{
				origin.set(quad.x, quad.y, quad.z + velocity.z);
				origin.add(position);
				origin.add({
					x: 0.5,
					y: 0.5,
					z: 0.5 + midSize * 2
				});
				origin.floor();
				//this.collisionHelpers[i].position.copy(origin);
				//this.collisionHelpers[i].show();
				let face = world.getFace(origin.x | 0, origin.y | 0, origin.z | 0, ((direction.z < 0) ? 0 : 1));
				if (face && face.blockInfo.type !== 1) {
					if (!collidingFace || (direction.z > 0 && collidingFace && collidingFace.position.z < face.position.z) || (direction.z < 0 && collidingFace && collidingFace.position.z > face.position.z))
						collidingFace = face;
				}
			}
			);
			if (collidingFace && true) {
				let stop = false;
				let facePos = collidingFace.position.z - midSize;
				if ((position.z + velocity.z <= facePos && position.z >= facePos) || (position.z + velocity.z >= facePos && position.z <= facePos)) {
					velocity.z = 0;
					position.z = facePos;
				}
			}
		}
		//velocity.z = 0;
		position.add(velocity);
	},
	updateCollisionBoundingRect: function() {
		let quad = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
		  , quadHor = [[1, 1], [-1, 1], [-1, -1], [1, -1], [1, 0.5], [-1, 0.5]]
		  , adjustment = 0.01;
		this.quadY = quad.map((obj,id)=>{
			return {
				x: (obj[0]) * this.size.x / 2 + ((id == 1 || id == 2) ? adjustment : -adjustment),
				y: 0,
				z: (obj[1]) * this.size.z / 2 + ((id > 1) ? adjustment : -adjustment)
			}
		}
		);
		this.quadX = quadHor.map((obj,id)=>{
			return {
				x: 0,
				y: obj[1] * this.size.y / 2 + ((id > 1) ? adjustment : -adjustment),
				z: obj[0] * this.size.z / 2 + ((id == 1 || id == 2) ? adjustment : -adjustment)
			}
		}
		);
		this.quadZ = quadHor.map((obj,id)=>{
			return {
				x: obj[0] * this.size.x / 2 + ((id == 1 || id == 2) ? adjustment : -adjustment),
				y: obj[1] * this.size.y / 2 + ((id > 1) ? adjustment : -adjustment),
				z: 0
			}
		}
		);
	}
}
