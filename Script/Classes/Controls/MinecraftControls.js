function MinecraftControls(scene, camera) {
	this.clickCallback = undefined;
	if (camera instanceof THREE.Camera)
		this.pointerlock = new THREE.PointerLockControls(camera);
	else {
		console.error("Controls could not be initialized due to lack of camera");
	}
	this.player = this.pointerlock.getObject();
	this.pitch = this.pointerlock.getPitchObject();
	this.loadPlayerState();
	this.pointerlock.enabled = false;
	document.body.onkeydown = (ev)=>{
		if (typeof this.parent === "object" && this.parent.gamePaused)
			return
		if (ev.key === 'e' || ev.key === "i") {
			if (this.pointerlock.enabled)
				this.releaseMouse();
			else
				this.requestMouse();
			return false;
		} else if (ev.key === "F5")
			this.savePlayerState();
		else if (!ev.ctrlKey && ev.key === "p" && typeof this.onPause === "function")
			this.onPause();
		else if (ev.ctrlKey && ev.key === "b") {
			options.ignoreCollision = !options.ignoreCollision;
			options.save();
			if (typeof logger === "object")
				logger.log("Collision "+(options.ignoreCollision?"disabled":"enabled"));
		} else if (ev.ctrlKey && ev.key === "m") {
			options.ignoreExcessiveLag = !options.ignoreExcessiveLag;
			options.save();
			if (typeof logger === "object")
				logger.log("Auto-pause "+(options.ignoreExcessiveLag?"disabled":"enabled"));
		} else if (ev.key === "f")
			console.log("Rendering " + renderer.getRenderLength() + " different faces");
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
			if (typeof this.onEnter === "function")
				this.onEnter();
		} else {
			this.savePlayerState();
			this.pointerlock.enabled = false;
			if (typeof this.onExit === "function")
				this.onExit();
		}
	}
	, false)
	document.addEventListener('pointerlockerror', this.releaseMouse, false);
	if (scene instanceof THREE.Scene)
		scene.add(this.player)
	else {
		console.warn("Unable to put player in scene due to incorrect parameter");
	}
	this.velocity = new THREE.Vector3();
	this.collision = new CollisionController(scene, blocks.blocks);
	this.moveForward = false;
	this.moveLeft = false;
	this.moveBackward = false;
	this.moveRight = false;
	this.moveUp = false;
	this.moveDown = false;
	this.vertical = 0;
	document.addEventListener('keydown', (event)=>this.onKeyChange(event.keyCode, 1, event.shiftKey), false);
	document.addEventListener('keyup', (event)=>this.onKeyChange(event.keyCode, 0, event.shiftKey), false);
}
MinecraftControls.prototype = {
	constructor: MinecraftControls,
	update: function() {
		this.setupVelocity();
		[{
			axis: "x",
			axisOrientation: "horizontal",
			quad: this.collision.quadX,
			sideLength: options.collisionBoundingRect.horizontal,
			direction: { x: Math.sign(this.velocity.x), y: 0, z: 0 }
		}, {
			axis: "y",
			axisOrientation: "vertical",
			quad: this.collision.quadY,
			direction: { x: 0, y: this.vertical, z: 0 }
		}, {
			axis: "z",
			axisOrientation: "horizontal",
			quad: this.collision.quadZ,
			direction: { x: 0, y: 0, z: Math.sign(this.velocity.z) }
		}].forEach(obj=>{
			if (this.velocity[obj.axis] != 0) {
				let velocity = this.velocity[obj.axis] * options.playerSpeed[obj.axisOrientation];
				let canMove = this.collision.check(this.player.position, obj.quad, obj.direction, Math.abs(velocity), options.collisionBoundingRect[obj.axisOrientation]);
				let newValue = canMove?velocity:this.collision.limit;
				if (isNaN(newValue))
					newValue = 0;
				this.player.position[obj.axis] += newValue;
			}
		}
		);
		if (this.player.position.y < 0)
			this.player.position.y = 0;
		if (isNaN(this.player.position.x)) {
			this.player.position.x = options.defaultPosition.x;
		}
		if (isNaN(this.player.position.y)) {
			this.player.position.y = options.defaultPosition.y;
		}
		if (isNaN(this.player.position.z)) {
			this.player.position.z = options.defaultPosition.z;
		}
	},
	releaseMouse: function() {
		let exit = this.onExit;
		this.onExit = () => {};
		document.exitPointerLock();
		this.onExit = exit;
	},
	requestMouse: function() {
		document.body.requestPointerLock();
	},
	loadPlayerState: function() {
		if (typeof getCookie === "function") {
			var x = getCookie("rs_posX")
			  , y = getCookie("rs_posY")
			  , z = getCookie("rs_posZ");
			if (x && y && z && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
				this.player.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
			} else {
				this.player.position.copy(options.defaultPosition);
			}
			x = getCookie("rs_rotX");
			y = getCookie("rs_rotY");
			if (x && y) {
				this.pitch.rotation.set(parseFloat(x), 0, 0);
				this.player.rotation.set(0, parseFloat(y), 0);
			} else {
				this.pitch.rotation.x = (options.defaultRotation.pitch);
				this.player.rotation.y = (options.defaultRotation.yaw);
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
		let value = this.moveForward + this.moveBackward*2 + this.moveLeft*4 + this.moveRight*8;
		let x, z;
		if (value === 1) { x = 0; z = -1 }
		else if (value === 2) { x = 0; z = 1 }
		else if (value === 4) { x = -1; z = 0 }
		else if (value === 5) { x = -0.70703125; z = -0.70703125 }
		else if (value === 6) { x = -0.70703125; z = 0.70703125 }
		else if (value === 7) { x = -1; z = 0 }
		else if (value === 8) { x = 1; z = 0 }
		else if (value === 9) { x = 0.70703125; z = -0.70703125 }
		else if (value === 10) { x = 0.70703125; z = 0.70703125 }
		else if (value === 11) { x = 1; z = 0 }
		else if (value === 13) { x = 0; z = -1 }
		else if (value === 14) { x = 0; z = 1 }
		else {
			x = 0;
			z = 0;
		}
		this.velocity.set(x, this.vertical, z);
		if (controls.player.quaternion && !isNaN(controls.player.quaternion.x)) {
			this.velocity.applyQuaternion(controls.player.quaternion);
		} else {
			controls.player.quaternion.set(0,0,0,0);
			this.velocity.applyQuaternion(controls.player.quaternion);
		}
	}
}