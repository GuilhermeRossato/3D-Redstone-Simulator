function MinecraftControls(scene, camera) {
	this.clickCallback = undefined;
	if (camera instanceof THREE.Camera)
		this.pointerlock = new THREE.PointerLockControls(camera);
	else {
		console.warn("Controls could not be initialized due to lack of camera");
		logger.error("Controls could not be initialized due to lack of camera");
	}
	this.player = this.pointerlock.getObject();
	this.pitch = this.pointerlock.getPitchObject();
	this.loadPlayerState();
	this.pointerlock.enabled = false;
	document.body.onclick = ()=>{
		if (!menuClick) {
			if (this.pointerlock.enabled) {
				if (typeof this.clickCallback === "function")
					this.clickCallback.call(this);
			} else {
				this.requestMouse();
			}
		}
	}
	document.body.onkeydown = (ev)=>{
		if (ev.key === 'e' || ev.key === "i") {
			if (this.pointerlock.enabled)
				this.releaseMouse();
			else
				this.requestMouse();
			return false;
		} else if (ev.key === "F5")
			this.savePlayerState();
		return true;
	}
	document.body.onkeyup = function(ev) {
		if (ev.key == '-' || ev.key == '+')
			updateMenuCookies();
		return true;
	}
	document.addEventListener('pointerlockchange', ()=>{
		if (document.pointerLockElement == document.body) {
			this.pointerlock.enabled = true;
		} else {
			this.savePlayerState();
			this.pointerlock.enabled = false;
		}
	}
	, false)
	document.addEventListener('pointerlockerror', this.releaseMouse, false);
	if (scene instanceof THREE.Scene)
		scene.add(this.player)
	else {
		console.warn("Unable to put player in scene due to incorrect parameter");
		logger.log("Unable to put player in scene due to incorrect parameter");
	}
	this.velocity = new THREE.Vector3();
	this.collision = new CollisionController(scene);
	this.moveForward = false;
	this.moveLeft = false;
	this.moveBackward = false;
	this.moveRight = false;
	this.moveUp = false;
	this.moveDown = false;
	this.vertical = 0;
	document.addEventListener('keydown', (event)=>this.onKeyChange(event.keyCode, true, event.shiftKey), false);
	document.addEventListener('keyup', (event)=>this.onKeyChange(event.keyCode, false, event.shiftKey), false);
}
MinecraftControls.prototype = {
	constructor: MinecraftControls,
	update: function() {
		this.setupVelocity();
		[{
			axis:"x",
			quad: this.quadX,
			optionsName: "horizontal",
			sideLength: options.collisionBoundingRect.horizontal,
			direction: {
				x: Math.sign(this.velocity.x),
				y: 0,
				z: 0
			}
		}, {
			axis:"y",
			quad: this.quadY,
			optionsName: "vertical",
			direction: {
				x: 0,
				y: this.vertical,
				z: 0
			}
		}, {
			axis:"z",
			quad: this.quadZ,
			optionsName: "horizontal",
			direction: {
				x: 0,
				y: 0,
				z: -Math.sign(this.velocity.z)
			}
		}].forEach(obj=>{
			if (this.velocity[obj.axis] != 0) {
				let velocity = (this.velocity[obj.axis] * options.playerSpeed[obj.optionsName]);
				let canMove;
				if (obj.axis == "x") {
					canMove = this.collision.checkX(this.player.position, obj.direction, Math.abs(velocity), options.collisionBoundingRect[obj.optionName]);
				} else if (obj.axis == "y") {
					canMove = this.collision.checkY(this.player.position, obj.direction.y, Math.abs(velocity), options.collisionBoundingRect[obj.optionName]);
				} else {
					canMove = this.collision.check(this.player.position, obj.direction, Math.abs(velocity), options.collisionBoundingRect[obj.optionName]);
				}
				if (canMove) {
					this.player.position[obj.axis] += velocity;
				} else {
					this.player.position[obj.axis] += this.collision.limit;
				}
			}
		}
		);
		/*
		if (this.velocity.x != 0) {
			this.velocity.x *= options.playerSpeed.horizontal;
			let direction = Math.sign(this.velocity.x);
			let velocity = Math.abs(this.velocity.x);
			let canMoveX = this.collision.checkX(this.player.position, direction, velocity);
			if (canMoveX) {
				this.player.position.x += this.velocity.x;
			} else if (direction != 0 && this.collision.limitX < 2) {
				this.player.position.x += this.collision.limitX;
			}
		}
		if (this.velocity.z != 0) {
			this.velocity.z *= options.playerSpeed.horizontal;
			let direction = Math.sign(this.velocity.z);
			let velocity = Math.abs(this.velocity.z);
			let canMoveZ = this.collision.checkZ(this.player.position, direction, velocity);
			if (canMoveZ) {
				this.player.position.z += this.velocity.z;
			} else if (direction != 0 && this.collision.limitZ < 2) {
				this.player.position.z += this.collision.limitZ;
			}
		}
		if (this.velocity.y != 0) {
			this.velocity.y *= options.playerSpeed.vertical;
			let direction = this.vertical;
			let velocity = Math.abs(this.velocity.y);
			let canMoveY = this.collision.checkY(this.player.position, direction, velocity);
			if (canMoveY) {
				this.player.position.y += this.velocity.y;
			} else if (direction != 0 && this.collision.limitY < 2) {
				this.player.position.y += this.collision.limitY;
			}
		}*/
	},
	releaseMouse: function() {
		document.exitPointerLock();
	},
	requestMouse: function() {
		document.body.requestPointerLock();
	},
	loadPlayerState: function() {
		if (typeof getCookie === "function") {
			var x = getCookie("rs_posX")
			  , y = getCookie("rs_posY")
			  , z = getCookie("rs_posZ");
			if (x && y && z) {
				this.player.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
			}
			x = getCookie("rs_rotX");
			y = getCookie("rs_rotY");
			if (x && y) {
				this.pitch.rotation.set(parseFloat(x), 0, 0);
				this.player.rotation.set(0, parseFloat(y), 0);
			}
		}
	},
	savePlayerState: function() {
		if ((typeof universeState === "object") && (universeState.animation || universeState.animating)) {} else if (typeof setCookie === "function") {
			var d = options.cookiesLastingDays;
			setCookie("rs_posX", this.player.position.x, d);
			setCookie("rs_posY", this.player.position.y, d);
			setCookie("rs_posZ", this.player.position.z, d);
			setCookie("rs_rotX", this.pitch.rotation.x, d);
			setCookie("rs_rotY", this.player.rotation.y, d);
		}
	},
	onKeyChange: function(keyCode, down, shiftKey) {
		switch (keyCode) {
		case 38:
			// up
		case 87:
			// w
			this.moveForward = down;
			break;
		case 37:
			// left
		case 65:
			// a
			this.moveLeft = down;
			break;
		case 40:
			// down
		case 83:
			// s
			this.moveBackward = down;
			break;
		case 39:
			// right
		case 68:
			// d
			this.moveRight = down;
			break;
		case 32:
			// space
			if (down)
				this.vertical = 1;
			else if (this.vertical === 1)
				this.vertical = 0;
			break;
		case 16:
			// shift
			if (down)
				this.vertical = -1;
			else if (this.vertical === -1)
				this.vertical = 0;
			break;
		}
	},
	setupVelocity: function() {
		this.velocity.set(0, 0, 0);
		if (this.moveForward)
			this.velocity.z -= 1;
		if (this.moveBackward)
			this.velocity.z += 1;
		if (this.moveLeft)
			this.velocity.x -= 1;
		if (this.moveRight)
			this.velocity.x += 1;
		this.velocity.normalize();
		this.velocity.applyQuaternion(this.player.quaternion);
		this.velocity.y = this.vertical;
	}
}
