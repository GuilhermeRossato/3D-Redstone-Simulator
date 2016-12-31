function AnimationController(camera, starts, restarts) {
	this.camera = camera;
	this.animationDuration_ms = 5000;
	this.animationStep_ms = 16;
	this.reset_at_end = restarts ? true : false;
	this.enabled = starts ? true : false;
	this.manualStep = false;
	this.clickStep = false;
	this.keyStep = true;
	if (this.enabled)
		this.begin();
	this.reset();
	document.addEventListener("keydown", (ev)=>{
		if (this.enabled && !ev.ctrlKey) {
			if (ev.key == 'r') {
				this.reset();
			} else if (ev.key == "s" && this.keyStep) {
				this.step();
			}
		}
	}
	);
}
AnimationController.prototype = {
	constructor: AnimationController,
	placeCamera: function(t) {
		var wide = 1;
		//t = t * 2;
		//if (t > 1) t = 1 - (t - 1);
		t = interpolate([0,1-wide/2], [0,1-wide/2], [1, 1+wide/2], [1, 1+wide/2]).at(t);
		var angle = t * Math.PI * 2
		  , cos = Math.cos(angle)
		  , sin = Math.sin(angle);
		var past = (0.25 < t && t < 0.75);
		this.camera.position.set(sin * 4.5, 4 , cos * 6);
		this.camera.lookAt(new THREE.Vector3(0,-1,0));
	},
	begin: function() {
		console.log("Will take " + (this.animationDuration_ms / this.animationStep_ms) + " steps to finish");
		this.lastParent = this.camera.parent;
		this.lastOnClick = document.body.onclick;
		document.body.onclick = (()=>(this.clickStep&&this.step()));
		this.camera.parent = null;
		this.enabled = true;
		this.forceClearance();
	},
	finish: function() {
		this.camera.position.set(0, 0, 0);
		this.camera.rotation.set(0, 0, 0);
		if (this.lastParent)
			this.camera.parent = this.lastParent;
		if (this.lastOnClick)
			document.body.onclick = this.lastOnClick;
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
				this.updateCamera();
			} else if (this.reset_at_end) {
				this.reset();
				this.updateCamera();
			} else {
				this.finish();
			}
		}
	},
	reset: function() {
		this.at = 0;
		if (this.enabled)
			this.updateCamera();
	},
	updateCamera() {
		this.placeCamera(ib(0, this.animationDuration_ms, this.at));
	},
	forceClearance: function() {
		Array.from(document.body.childNodes).forEach(obj=>{
			if (!(["LINK", "CANVAS", "SCRIPT"].some(acceptedTag=>obj.tagName === acceptedTag))) {
				document.body.removeChild(obj);
			} else if (obj.tagName === "CANVAS") {
				obj.style.zIndex = 0;
			}
		}
		)
	}
}
