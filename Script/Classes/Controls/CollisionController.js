function CollisionController(scene) {
	this.raycaster = new THREE.Raycaster(undefined, new THREE.Vector3(0,1,0), 0, 1);
}

CollisionController.prototype = {
	constructor: CollisionController,
	horizontalCheck: function(position, velocity, size) {
		var side = options.collisionBoundingRect.horizontal;
		this.raycaster.near = 0;
		this.raycaster.far = size;
		this.raycaster.ray.direction.copy(velocity);

		return [[1,1], [-1,1], [-1,-1], [1,-1]].map(obj => {return {x:obj[0]*side, y:0, z:obj[1]*side}}).some(vec=>{
			this.raycaster.ray.origin.set(position.x+vec.x, position.y+vec.y, position.z+vec.z);
			this.intersects = this.raycaster.intersectObjects(scene.children);
			if (this.intersects.length > 0) {
				return true;
			}
			return false;
		})
	},
	verticalCheck: function(position, height) {
		if (height !== 0) {
			this.raycaster.ray.origin.copy(position);
			this.raycaster.far = Math.abs(height);
			this.raycaster.ray.origin.y -= (height > 0)?options.collisionBoundingRect.top:options.collisionBoundingRect.bottom;
			this.raycaster.ray.direction.set(0, (height > 0)?-1:1, 0);
			this.intersects = this.raycaster.intersectObjects(scene.children);
			return (this.intersects.length > 0);
		}
		return false;
	},
	verticalLimit: function() {
		if (this.intersects[0]) {
			console.log(this.intersects[0]);
		}
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