// This is a very specific class, don't use it somewhere else without some serious rewrite

function AnimationController(camera) {
	this.enabled = false;
	this.reset_at_end = false;
	this.manualStep = true;
	this.clickStep = false;
	this.keyStep = true;
	this.camera = camera;
	this.animationDuration_ms = 3300;
	this.animationStep_ms = 30;
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
	if (this.enabled) {
		this.keydown = document.body.onkeydown;
		document.body.onkeydown = () => {};
	}
}

AnimationController.prototype = {
	constructor: AnimationController,
	placeCamera: function(t) {
		this.animation_go(t);
		if (typeof player === "object" && player instanceof Player)
			player.controls.player.position.copy(this.camera.position);
	},
	animation_go(t) {
		t*=t*70;
		let velocity = {x:-0.9283*t, y:0, z:0.5718*t};
		this.camera.position.set(velocity.x,13,velocity.z);
		this.camera.lookAt(new THREE.Vector3(velocity.x-0.9283,12.3,velocity.z+0.5718));
	},
	animation_rotate2: function(t) {
		t = (6*t*t*t*t*t + -15*t*t*t*t + 10*t*t*t);
		var angle = t * Math.PI * 2
		  , cos = Math.cos(angle)
		  , sin = Math.sin(angle);
		this.camera.position.set(sin * 8, 11 , cos * 8);
		this.camera.lookAt(new THREE.Vector3(0,-1,0));
	},
	animation_rotate1: function(t) {
		var wide = 1;
		t = interpolate([0,1-wide/2], [0,1-wide/2], [1, 1+wide/2], [1, 1+wide/2]).at(t);
		var angle = t * Math.PI * 2
		  , cos = Math.cos(angle)
		  , sin = Math.sin(angle);
		var past = (0.25 < t && t < 0.75);
		this.camera.position.set(sin * 31, 16 , cos * 31);
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
		this.onkeydown = this.keydown;
		if (typeof player === "object" && player instanceof Player)
			player.controls.player.position.set(0,10,0);
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
		var toRemove = [];
		Array.from(document.body.childNodes).forEach(obj=>{
			if (!(["LINK", "CANVAS", "SCRIPT"].some(acceptedTag=>obj.tagName === acceptedTag))) {
				toRemove.push(obj);
			} else if (obj.tagName === "CANVAS") {
				obj.style.zIndex = 0;
			}
		}
		)
		toRemove.forEach((obj) => {
			document.body.removeChild(obj);
		});
		if (typeof controls === "object")
			controls.enabled = false;
		if (typeof gui === "object") {
			gui.main.style.display = "none"
			gui.secondary.style.display = "none";
			gui.fill.style.display = "none";
		}
	}
}
