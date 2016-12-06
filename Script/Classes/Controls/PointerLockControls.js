/**
 * @author mrdoob / http://mrdoob.com/
 * Slightly edited by GuilhermeRossato
 */
THREE.PointerLockControls = function(camera) {
	var scope = this;
	camera.rotation.set(0, 0, 0);
	var pitchObject = new THREE.Object3D();
	pitchObject.add(camera);
	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add(pitchObject);
	var PI_2 = Math.PI / 2;
	var onMouseMove = function(event) {
		if (scope.enabled === false)
			return;
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;
		pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
	};
	this.dispose = function() {
		document.removeEventListener('mousemove', onMouseMove, false);
	}
	document.addEventListener('mousemove', onMouseMove, false);
	this.enabled = false;
	this.getObject = function() {
		return yawObject;
	}
	this.getDirection = function() {
		// assumes the camera itself is not rotated
		var direction = new THREE.Vector3(0,0,-1);
		var rotation = new THREE.Euler(0,0,0,"YXZ");
		return function(v) {
			rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0);
			v.copy(direction).applyEuler(rotation);
			return v;
		}
	}
	this.moveForward = false;
	this.moveLeft = false;
	this.moveBackward = false;
	this.moveRight = false;
	this.moveUp = false;
	this.moveDown = false;
	this.onKeyChange = function(keyCode, down, shiftKey) {
		switch (keyCode) {
		case 38: // up
		case 87: // w
			this.moveForward = down;
			break;
		case 37: // left
		case 65: // a
			this.moveLeft = down;
			break;
		case 40: // down
		case 83: // s
			this.moveBackward = down;
			break;
		case 39: // right
		case 68: // d
			this.moveRight = down;
			break;
		case 32: // space
			this.moveUp = this.enabled && down;
			break;
		case 16: // shift
			this.moveDown = this.enabled && down;
			break;
		}
	}
	document.addEventListener( 'keydown', (event) => this.onKeyChange(event.keyCode, true, event.shiftKey), false );
	document.addEventListener( 'keyup', (event) => this.onKeyChange(event.keyCode, false, event.shiftKey), false );
	this.getDirection();
}
