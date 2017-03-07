function MinecraftControls(parent, scene, camera) {
	this.onRelease = undefined;
	this.onStart = undefined;

	if (!(scene instanceof THREE.Scene && camera instanceof THREE.Camera))
		throw "Parameter Error";

	this.parent = parent;
	this.pointerlock = new THREE.PointerLockControls(camera);
	this.yaw = this.pointerlock.getObject();
	this.pitch = this.yaw.children[0];
	this.yaw.name = "Camera Yaw";
	this.pitch.name = "Camera Pitch";
	scene.add(this.yaw);
	this.loadPlayerState();
	this.direction = new THREE.Vector3();
	this.speed = new THREE.Vector3(options.player.speed.horizontal,options.player.speed.vertical,options.player.speed.horizontal);
	this.velocity = new THREE.Vector3();
	this.collision = new CollisionController(this, scene, options.player.collisionSize);
	this.collision.showBoundingBox(this.yaw.position);

	this.moveForward = false;
	this.moveLeft = false;
	this.moveBackward = false;
	this.moveRight = false;
	this.moveUp = false;
	this.moveDown = false;
	this.vertical = 0;

	document.addEventListener('pointerlockchange', (event)=>this.onPointerlockChange(event), false)
	document.addEventListener('pointerlockerror', (event)=>this.onPointerlockError(event), false);
	document.addEventListener('keydown', (event)=>this.onKeyChange(event.code, 1, event.shiftKey), false);
	document.addEventListener('keyup', (event)=>this.onKeyChange(event.code, 0, event.shiftKey), false);
}
MinecraftControls.prototype = {
	constructor: MinecraftControls,
	onPointerlockChange: function() {
		if (document.pointerLockElement == document.body && !this.pointerlock.enabled) {
			this.pointerlock.enabled = true;
			if (this.onStart)
				this.onStart();
		} else if (this.pointerlock.enabled) {
			this.savePlayerState();
			this.pointerlock.enabled = false;
			if (this.onRelease)
				this.onRelease();
		}
	},
	onPointerlockError: function() {
		this.releaseMouse();
	},
	onKeyChange: function(code, down, shiftKey) {
		switch (code) {
		case options.keys.forward:
			this.moveForward = down;
			break;
		case options.keys.left:
			this.moveLeft = down;
			break;
		case options.keys.back:
			this.moveBackward = down;
			break;
		case options.keys.right:
			this.moveRight = down;
			break;
		case options.keys.up:
			if (down)
				this.vertical = 1;
			else if (this.vertical === 1)
				this.vertical = 0;
			break;
		case options.keys.down:
			if (down)
				this.vertical = -1;
			else if (this.vertical === -1)
				this.vertical = 0;
			break;
		}
	},
	update: function() {
		this.setupDirection();
		if (this.collision)
			this.collision.step(this.yaw.position, this.direction, this.speed);
		else
			this.velocity.set(this.direction.x * this.speed.x, this.direction.y * this.speed.y, this.direction.z * this.speed.z);
		this.yaw.position.add(this.velocity);
	},
	releaseMouse: function() {
		document.exitPointerLock();
	},
	requestMouse: function() {
		document.body.requestPointerLock();
	},
	setupDirection: function() {
		let value = this.moveForward + this.moveBackward * 2 + this.moveLeft * 4 + this.moveRight * 8;
		let x, z;
		if (value > 0 && value < 15 && value !== 12) {
			x = [0, 0, 0, -1, -0.70703125, -0.70703125, -1, 1, 0.70703125, 0.70703125, 1, 0, 0, 0][value - 1];
			z = [-1, 1, 0, 0, -0.70703125, 0.70703125, 0, 0, -0.70703125, 0.70703125, 0, 0, -1, 1][value - 1];
		} else {
			x = 0;
			z = 0;
		}
		this.direction.set(x, this.vertical, z);
		this.direction.applyQuaternion(this.yaw.quaternion);
	},
	loadPlayerState: function() {
		if (typeof getCookie === "function") {
			var x = getCookie("rs_posX")
			  , y = getCookie("rs_posY")
			  , z = getCookie("rs_posZ");
			if (x && y && z) {
				this.yaw.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
			} else {
				this.yaw.position.set(options.defaultPosition.x, options.defaultPosition.y, options.defaultPosition.z);
			}
			x = getCookie("rs_rotX");
			y = getCookie("rs_rotY");
			if (x && y) {
				this.pitch.rotation.set(parseFloat(x), 0, 0);
				this.yaw.rotation.set(0, parseFloat(y), 0);
			} else {
				this.pitch.rotation.set(options.defaultRotation.pitch);
				this.yaw.rotation.set(options.defaultRotation.yaw);
			}
		}
	},
	savePlayerState: function() {
		if (typeof setCookie === "function") {
			var d = options.cookiesLastingDays;
			setCookie("rs_posX", this.yaw.position.x, d);
			setCookie("rs_posY", this.yaw.position.y, d);
			setCookie("rs_posZ", this.yaw.position.z, d);
			setCookie("rs_rotX", this.pitch.rotation.x, d);
			setCookie("rs_rotY", this.yaw.rotation.y, d);
		}
	},
}
