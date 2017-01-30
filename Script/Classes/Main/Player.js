var controls;

function Player(scene, camera, self) {
	if (self) {
		this.controls = new MinecraftControls(scene, camera);
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
		this.parent.showCrosshair();
	},
	onReleaseMouse: function() {
		this.parent.showInventory();
	},
	onMouseDown: function(e) {
		console.log("World Interaction Press");
	},
	onMouseUp: function(e) {
		
	},
	update: function() {
		this.raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
		this.selection.visible = false;
		var intersections = this.raycaster.intersectObjects(scene.children);
		var lastInter = undefined;
		intersections.some((obj)=>{
			if (obj.object.realPosition instanceof THREE.Vector3) {
				lastInter = obj;
				return true;
			}
			return false;
		}
		);
		if (lastInter) {
			selection.visible = true;
			selection.position.copy(lastInter.object.realPosition);
		}
		this.controls.update();
		if (typeof animator === "object" && animator.enabled && !animator.manualStep) {
			animator.step();
		} else if (typeof animator === "object" && animator.enabled) {
			animator.updateCamera();
		}
	}
}
