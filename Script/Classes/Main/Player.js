var controls, collisionHelper;

function Player(scene, camera, self) {
	if (self) {
		this.controls = new MinecraftControls(scene, camera);
		this.controls.onPause = () => this.parent.showPaused();
		this.controls.onEnter = () => this.onGrabMouse();
		this.controls.onExit = () => this.onReleaseMouse();
		let h = options.selectionBoundSpace / 2;
		let geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(-h,-h,-h), new THREE.Vector3(-h,h,-h), new THREE.Vector3(h,h,-h), new THREE.Vector3(h,-h,-h), new THREE.Vector3(-h,-h,-h), new THREE.Vector3(-h,-h,h), new THREE.Vector3(-h,h,h), new THREE.Vector3(h,h,h), new THREE.Vector3(h,-h,h), new THREE.Vector3(h,-h,-h), new THREE.Vector3(h,h,-h), new THREE.Vector3(-h,h,-h), new THREE.Vector3(-h,h,h), new THREE.Vector3(-h,-h,h), new THREE.Vector3(h,-h,h), new THREE.Vector3(h,h,h), new THREE.Vector3(h,h,-h));
		let material = new THREE.LineBasicMaterial({
			color: 0x000000
		});
		this.selection = new THREE.Line(geometry,material);
		this.selection.visible = false;
		this.raycaster = new THREE.Raycaster(undefined, undefined, 0, 10);
		scene.add(this.selection);
		/* Definition of global variables */
		controls = this.controls;

		/* Initializing Collision Helper
		material = new THREE.LineBasicMaterial({
			color: 0xff0000
		});
		geometry = geometry.clone();
		geometry.vertices.map(obj => obj.multiplyScalar((options.collisionBoundingRect.horizontal+0.0001)/h));
		collisionHelper = new THREE.Line(geometry, material);
		scene.add(collisionHelper);*/
		/* Initializing Animator */
		this.animator = new AnimationController(camera);
		animator = this.animator;
	} else {
		let geometry = new THREE.CubeGeometry(1,2,1);
		let material = new THREE.BasicMaterial({color:0x000000});
		this.representation = new THREE.Mesh(geometry, material);
		scene.add(this.representation);
	}
}

Player.prototype = {
	constructor: Player,
	requestMouse: function() {
		this.controls.requestMouse();
	},
	onGrabMouse: function() {
		if (this.parent.gamePaused)
			this.parent.showCrosshair();
	},
	onReleaseMouse: function() {
		if (this.parent.stats && ((performance || Date).now() - this.parent.stats.getLastUpdate() > 160))
			this.parent.showPaused();
		else if (!this.parent.gamePaused) 
			this.parent.showInventory();
	},
	onMouseDown: function(e) {
		console.log("World Interaction Press");
	},
	onMouseUp: function(e) {
		
	},
	lightUpdate: function() {
		if (this.selection.visible) {
			this.selection.visible = false;
			this.controls.update();
			this.selection.visible = true;
		} else 
			this.controls.update();
	},
	update: function() {
		this.selection.visible = false;
		this.raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
		//var intersections = this.raycaster.intersectObjects(scene.children);
		var intersections = [];
		var lastInter = undefined;
		intersections.some((obj)=>{
			if (obj.object.realPosition instanceof THREE.Vector3) {
				lastInter = obj;
				return true;
			}
			return false;
		}
		);
		this.controls.update();
		if (lastInter) {
			this.selection.visible = true;
			this.selection.position.copy(lastInter.object.realPosition);
		}
		if (typeof animator === "object" && animator.enabled && !animator.manualStep) {
			animator.step();
		} else if (typeof animator === "object" && animator.enabled) {
			animator.updateCamera();
		}
	}
}
