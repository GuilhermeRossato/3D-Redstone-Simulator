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
	document.body.onclick = () => {
		if (!menuClick) {
			if (this.pointerlock.enabled) {
				if (typeof this.clickCallback === "function")
					this.clickCallback.call(this);
			} else {
				this.requestMouse();
			}
		}
	}
	document.body.onkeydown = (ev) => {
		if (ev.key === 'e' || ev.key === "i") {
			if (this.pointerlock.enabled)
				this.releaseMouse();
			else
				this.requestMouse();
			return false;
		}
		return true;
	}
	document.body.onkeyup = function(ev) {
		if (ev.key == '-' || ev.key == '+')
			updateMenuCookies();
		return true;
	}
	document.addEventListener('pointerlockchange', () => {		
		if (document.pointerLockElement == document.body) {
			this.pointerlock.enabled = true;
		} else {
			this.savePlayerState();
			this.pointerlock.enabled = false;
		}
	}, false)
	document.addEventListener('pointerlockerror', this.releaseMouse, false);
	if (scene instanceof THREE.Scene)
		scene.add(this.player)
	else {
		console.warn("Unable to put player in scene due to incorrect parameter");
		logger.log("Unable to put player in scene due to incorrect parameter");
	}
	this.velocity = new THREE.Vector3();
	this.collision = new CollisionController(scene);
}

MinecraftControls.prototype = {
	constructor: MinecraftControls,
	update: function() {
		this.velocity.set(0, 0, 0);
		if (this.pointerlock.moveForward)
			this.velocity.z -= 1;
		if (this.pointerlock.moveBackward)
			this.velocity.z += 1;
		if (this.pointerlock.moveLeft)
			this.velocity.x -= 1;
		if (this.pointerlock.moveRight)
			this.velocity.x += 1;
		this.velocity.normalize();
		this.velocity.applyQuaternion(this.player.quaternion);
		if (!this.collision.horizontalCheck(this.player.position, this.velocity, options.playerSpeed.horizontal)) {
			this.velocity.multiplyScalar(options.playerSpeed.horizontal);
			this.player.position.add(this.velocity);
		}
		if (!this.collision.verticalCheck(this.player.position, options.playerSpeed.vertical*this.pointerlock.vertical)) {
			if (this.pointerlock.vertical == -1)
				this.player.position.y += options.playerSpeed.vertical;
			if (this.pointerlock.vertical == 1)
				this.player.position.y -= options.playerSpeed.vertical;
		}
		if (this.player.position.y < 0)
			this.player.position.y = 0;
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
		if ((typeof universeState === "object") && (universeState.animation || universeState.animating)) {
			
		} else if (typeof setCookie === "function") {
			var d = options.cookiesLastingDays;
			setCookie("rs_posX", this.player.position.x, d);
			setCookie("rs_posY", this.player.position.y, d);
			setCookie("rs_posZ", this.player.position.z, d);
			setCookie("rs_rotX", this.pitch.rotation.x, d);
			setCookie("rs_rotY", this.player.rotation.y, d);
		}
	}
}