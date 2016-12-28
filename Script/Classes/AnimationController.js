function AnimationController(camera, starts, restarts) {
	this.camera = camera;
	this.animationDuration_ms = 10000;
	this.animationStep_ms = 16;
	this.at = 0;
	this.reset_at_end = restarts ? true : false;
	this.enabled = starts ? true : false;
	if (this.enabled)
		this.begin();
}
AnimationController.prototype = {
	constructor: AnimationController,
	placeCamera: function(t) {
		var angle = t * Math.PI * 2
		  , cos = Math.cos(angle)
		  , sin = Math.sin(angle);
		this.camera.position.set(sin * 7, 4, cos * 7);
		this.camera.lookAt(new THREE.Vector3(0,0,0));
	},
	begin: function() {
		console.log("Will take "+(this.animationDuration_ms/this.animationStep_ms)+" steps to finish");
		this.lastParent = camera.parent;
		camera.parent = null;
		this.enabled = true;
		this.forceClearance();
	},
	finish: function() {
		if (this.lastParent)
			camera.parent = this.lastParent;
		this.enabled = false;
	},
	step: function() {
		if (this.enabled) {
			if (this.at < this.animationDuration_ms) {
				if (this.at + this.animationStep_ms > this.animationDuration_ms) {
					this.at = this.animationDuration_ms;
				} else {
					this.at += this.animationStep_ms;
				}
			} else if (this.reset_at_end) {
				this.reset();
			} else {
				this.finish();
			}
			this.updateCamera();
		}
	},
	reset: function() {
		this.at = 0;
	},
	updateCamera() {
		this.placeCamera(ib(0, this.animationDuration_ms, this.at));
	},
	forceClearance: function() {
		Array.from(document.body.childNodes).forEach(obj=>{
			if (!(["LINK", "CANVAS", "SCRIPT"].some(acceptedTag=>obj.tagName === acceptedTag))) {
				document.body.removeChild(obj);
			}
		}
		)
	}
}
