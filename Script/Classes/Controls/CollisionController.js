function CollisionController(parent, scene, size) {
	this.parent = parent;
	this.scene = scene;
	this.size = size;
	this.enabled = true;
	this.updateCollisionBoundingRect();
	if (Settings && Settings.player.collision.showBoundingBox.value) {
		this.showBoundingBox();
		let c_options = [true, false, false];
		if (c_options.some(m=>m)) {
			this.collisionDisplay = { x: [], y: [], z: [] }
			var colors = [];
			colors.push(c_options[0]?0xDDDDDD:false, c_options[0]?0xDB7D3E:false, c_options[0]?0xB350BC:false, c_options[0]?0x6B8AC9:false, c_options[0]?0xB1A627:false, c_options[0]?0x41AE38:false);
			colors.push(c_options[2]?0xD08499:false, c_options[2]?0x404040:false, c_options[2]?0x9AA1A1:false, c_options[2]?0x2E6E89:false, c_options[2]?0x7E3DB5:false, c_options[2]?0x2E388D:false);
			colors.push(c_options[1]?0x4F321F:false, c_options[1]?0x35461B:false, c_options[1]?0x963430:false, c_options[1]?0x191616:false);
			colors.forEach((color, i) => {
				if (color !== false) {
					let sh = new SpacialHighlight(scene, color, 0.1);
					sh.hide();
					let sp = new MinecraftSelection(scene,color);
					sp.setSize(1.04, 1.04, 1.04);
					sp.hide();
					if (i < 6)
						this.collisionDisplay.x.push([sh, sp]);
					else if (i < 12)
						this.collisionDisplay.z.push([sh, sp]);
					else
						this.collisionDisplay.y.push([sh, sp]);
				}
			});
		}
	}
}

CollisionController.prototype = {
	constructor: CollisionController,
	initiateBoundingBox: function(position) {
		this.boundingBox = new MinecraftSelection(this.scene);
		this.boundingBox.copySize(this.size);
		this.boundingBox.setColor(0xFF2255);
		this.boundingBox.position.copy(position);
	},
	showBoundingBox: function() {
		if (!this.boundingBox)
			this.initiateBoundingBox({ x: 0, y: 0, z: 0 });
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
		if (Settings && !Settings.player.collision.enabled.value) {
			position.add(velocity);
			return;
		}
		if (direction.x !== 0) {
			let midSize = this.size.x / 2 * ((direction.x < 0) ? -1 : 1);
			let collidingFace, origin;
			origin = new THREE.Vector3();
			this.quadX.forEach((quad,i)=>{
				origin.set(quad.x + velocity.x + position.x + (0.5 + midSize * 2), quad.y + position.y + (i <= 3 ? 0.5 : 0.125), quad.z + position.z + 0.5);
				if (this.collisionDisplay && this.collisionDisplay.x[i]) {
					this.collisionDisplay.x[i][0].position.copy(origin);
					this.collisionDisplay.x[i][0].show();
				}
				origin.floor();
				if (this.collisionDisplay && this.collisionDisplay.x[i]) {
					this.collisionDisplay.x[i][1].position.copy(origin);
					this.collisionDisplay.x[i][1].show();
				}
				let face = world.getFace(origin.x | 0, origin.y | 0, origin.z | 0, ((direction.x < 0) ? 2 : 3));
				if (face && isSolid(face.blockInfo.id, face.blockInfo.type)) {
					if (!collidingFace)
						collidingFace = face;
					else if (direction.x > 0) {
						if ((collidingFace.position.x < face.position.x)||(collidingFace.blockInfo.blockData.type === undefined)||(collidingFace.position.y < face.position.y))
							collidingFace = face;
					} else if (direction.x < 0) {
						if ((collidingFace.position.x > face.position.x)||(collidingFace.blockInfo.blockData.type === undefined)||(collidingFace.position.y < face.position.y))
							collidingFace = face;
					}
				}
			}
			);
			if (collidingFace) {
				let stop = false;
				let facePos = collidingFace.position.x - midSize;
				if ((position.x + velocity.x <= facePos && position.x >= facePos) || (position.x + velocity.x >= facePos && position.x <= facePos)) {
					if (collidingFace.blockInfo.blockData.type === 6) {
						let heightSlab = 0 - collidingFace.position.y - this.size.y / 2 + 0.25 + position.y;
						if (heightSlab >= 0 && heightSlab <= 0.5) {
							// Raise player
							position.y += 0.5 - heightSlab;
						} else {
							velocity.x = 0;
							position.x = facePos;
						}
					} else {
						let heightSlab = 0 - collidingFace.position.y - this.size.y / 2 + position.y;
						if (heightSlab >= 0 && heightSlab <= 0.5) {
							position.y += 0.5 - heightSlab;
						} else {
							velocity.x = 0;
							position.x = facePos;
						}
					}
				}
			}
		} else if (this.collisionDisplay) {
			this.collisionDisplay.x.forEach(obj => {
				obj[0].hide();
				obj[1].hide();
			});
		}
		position.x += velocity.x;
		if (direction.z !== 0) {
			let midSize = this.size.z / 2 * ((direction.z < 0) ? -1 : 1);
			let collidingFace, origin;
			origin = new THREE.Vector3();
			this.quadZ.forEach((quad,i)=>{
				origin.set(quad.x + position.x + 0.5, quad.y + position.y + (i <= 3 ? 0.5 : 0.125), quad.z + velocity.z+position.z + (0.5 + midSize * 2));
				if (this.collisionDisplay && this.collisionDisplay.z[i]) {
					this.collisionDisplay.z[i][0].position.copy(origin);
					this.collisionDisplay.z[i][0].show();
				}
				origin.floor();
				if (this.collisionDisplay && this.collisionDisplay.z[i]) {
					this.collisionDisplay.z[i][1].position.copy(origin);
					this.collisionDisplay.z[i][1].show();
				}
				let face = world.getFace(origin.x | 0, origin.y | 0, origin.z | 0, ((direction.z < 0) ? 0 : 1));
				if (face && isSolid(face.blockInfo.blockData)) {
					if (!collidingFace)
						collidingFace = face;
					else if (direction.z > 0) {
						if ((collidingFace.position.z < face.position.z)||(collidingFace.blockInfo.blockData.type === undefined)||(collidingFace.position.y < face.position.y))
							collidingFace = face;
					} else if (direction.z < 0) {
						if ((collidingFace.position.z > face.position.z)||(collidingFace.blockInfo.blockData.type === undefined)||(collidingFace.position.y < face.position.y))
							collidingFace = face;
					}
				}
			}
			);
			if (collidingFace) {
				let stop = false;
				let facePos = collidingFace.position.z - midSize;
				if ((position.z + velocity.z <= facePos && position.z >= facePos) || (position.z + velocity.z >= facePos && position.z <= facePos)) {
					if (collidingFace.blockInfo.blockData.type === 6) {
						let heightSlab = 0 - collidingFace.position.y - this.size.y / 2 + 0.25 + position.y;
						if (heightSlab >= 0 && heightSlab <= 0.5) {
							position.y += 0.5 - heightSlab;
						} else {
							velocity.z = 0;
							position.z = facePos;
						}
					} else {
						let heightSlab = 0 - collidingFace.position.y - this.size.y / 2 + position.y;
						if (heightSlab >= 0 && heightSlab <= 0.5) {
							position.y += 0.5 - heightSlab;
						} else {
							velocity.z = 0;
							position.z = facePos;
						}
					}
				}
			}
		} else if (this.collisionDisplay) {
			this.collisionDisplay.z.forEach(obj => {
				obj[0].hide();
				obj[1].hide();
			});
		}
		position.z += velocity.z;
		if (direction.y !== 0) {
			let midSize = this.size.y / 2 * ((direction.y < 0) ? -1 : 1);
			let collidingFace, origin;
			origin = new THREE.Vector3();
			this.quadY.forEach((quad,i)=>{
				origin.set(quad.x + position.x + 0.5, quad.y + velocity.y + position.y + (((direction.y < 0) ? 0.125 : 0.875) + midSize), quad.z+ position.z + 0.5);
				if (this.collisionDisplay && this.collisionDisplay.y[i]) {
					this.collisionDisplay.y[i][0].position.copy(origin);
					this.collisionDisplay.y[i][0].show();
				}
				origin.floor();
				if (this.collisionDisplay && this.collisionDisplay.y[i]) {
					this.collisionDisplay.y[i][1].position.copy(origin);
					this.collisionDisplay.y[i][1].show();
				}
				let face = world.getFace(origin.x | 0, origin.y | 0, origin.z | 0, (direction.y < 0) ? 4 : 5);
				if (face && isSolid(face.blockInfo.id, face.blockInfo.type)) {
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
		} else if (this.collisionDisplay) {
			this.collisionDisplay.y.forEach(obj => {
				obj[0].hide();
				obj[1].hide();
			});
		}
		position.y += velocity.y;
	},
	updateCollisionBoundingRect: function() {
		let quad = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
		  , quadHor = [[1, 1], [-1, 1], [-1, -1], [1, -1], [1, 0.5], [-1, 0.5]]
		  , adjustment = 0.0005;
		this.quadY = quad.map((obj,id)=>{
			return {
				x: (obj[0]) * this.size.x / 2 + ((obj[0] === -1) ? adjustment : -adjustment),
				y: 0,
				z: (obj[1]) * this.size.z / 2 + ((obj[1] === -1) ? adjustment : -adjustment)
			}
		}
		);
		this.quadX = quadHor.map((obj,id)=>{
			return {
				x: 0,
				y: obj[1] * this.size.y / 2 + ((obj[1] === -1) ? adjustment : -adjustment),
				z: obj[0] * this.size.z / 2 + ((obj[0] === -1) ? adjustment : -adjustment)
			}
		}
		);
		this.quadZ = quadHor.map((obj,id)=>{
			return {
				x: obj[0] * this.size.x / 2 + ((obj[0] === -1) ? adjustment : -adjustment),
				y: obj[1] * this.size.y / 2 + ((obj[1] === -1) ? adjustment : -adjustment),
				z: 0
			}
		}
		);
	}
}
