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
	initiateBoundingBox:function(position) {
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
		if (!this.enabled) return;
		if (this.boundingBox)
			this.boundingBox.position.copy(position);
		let velocity = new THREE.Vector3(direction.x * speed.x,direction.y * speed.y,direction.z * speed.z);
		if (direction.y < 0) {
			this.collisionHelpers[0].setColor(0xFFFFFF);
			this.collisionHelpers[1].setColor(0xFFFFFF);
			this.collisionHelpers[2].setColor(0xFFFFFF);
			this.collisionHelpers[3].setColor(0xFFFFFF);
			let collidingFace, origin;
			origin = new THREE.Vector3();
			this.quadY.forEach((quad,i)=>{
				origin.set(quad.x, quad.y + velocity.y, quad.z);
				origin.add(position);
				origin.y -= options.player.collisionBoundingRect.bottom;
				origin.add({x: 0.5,y: 0.99,z: 0.5});
				origin.floor();
				this.collisionHelpers[i].element.position.copy(origin);
				let face = world.getFace(origin.x | 0, origin.y | 0, origin.z  | 0, 4);
				if (face) {
					if (!collidingFace || (collidingFace && collidingFace.position.y < face.position.y))
						collidingFace = face;
				}
			});
			if (collidingFace) {
				let top = collidingFace.position.y - 0.15 + options.player.collisionBoundingRect.top;
				if (position.y + velocity.y <= top && position.y >= top) {
					velocity.y = 0;
					position.y = top;
				}
			}
		} else if (direction.y > 0) {
			let collidingFace, origin;
			origin = new THREE.Vector3();
			this.quadY.forEach((quad,i)=>{
				origin.set(quad.x, quad.y + velocity.y, quad.z);
				origin.add(position);
				origin.y += options.player.collisionBoundingRect.top;
				origin.add({
					x: 0.5,
					y: 0.5,
					z: 0.5
				});
				origin.floor();
				this.collisionHelpers[i].element.position.copy(origin);
				let block = world.getFace(origin.x + 0.5 | 0, origin.y + 0.5 | 0, origin.z + 0.5 | 0, 5);
				if (block) {
					if (!collidingFace || (collidingFace && collidingFace.position.y > block.position.y))
						collidingFace = block;
				}
			}
			);
			if (collidingFace) {
				let bottom = collidingFace.position.y - options.player.collisionBoundingRect.top;
				if (position.y + velocity.y >= bottom && position.y <= bottom) {
					velocity.y = 0;
					position.y = bottom;
				}
			}
		}
		position.add(velocity);
	},
	updateCollisionBoundingRect: function() {
		let t = options.player.collisionBoundingRect.top
		  , b = options.player.collisionBoundingRect.bottom
		  , h = options.player.collisionBoundingRect.horizontal
		  , quad = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
		  , adjustment = 0;
		this.quadY = quad.map((obj,id)=>{
			return {
				x: (obj[0]) * h + ((id == 1 || id == 2) ? adjustment : -adjustment),
				y: 0,
				z: (obj[1]) * h + ((id > 1) ? adjustment : -adjustment)
			}
		}
		);
		this.quadX = quad.map((obj,id)=>{
			return {
				x: 0,
				y: obj[1] * (obj[1] > 0 ? t : b) + ((id > 1) ? adjustment : -adjustment),
				z: obj[0] * h + ((id == 1 || id == 2) ? adjustment : -adjustment)
			}
		}
		);
		this.quadZ = quad.map((obj,id)=>{
			return {
				x: obj[0] * h + ((id == 1 || id == 2) ? adjustment : -adjustment),
				y: obj[1] * (obj[1] > 0 ? t : b) + ((id > 1) ? adjustment : -adjustment),
				z: 0
			}
		}
		);
	}
}
