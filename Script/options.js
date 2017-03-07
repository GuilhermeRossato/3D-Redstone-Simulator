var options = {
	keys: {
		forward: "KeyW",
		right: "KeyD",
		back: "KeyS",
		left: "KeyA",
		up: "Space",
		down: "ShiftLeft",
		inventory: "KeyE",
		debug: "KeyQ"
	},
	antialias: false,
	player: {
		ignoreCollision: false,
		verticalAdjustment: 0.0,
		speed: {
			horizontal: 0.085/1,
			vertical: 0.105/1
		},
		collisionSize: {
			x: 0.75,
			y: 1.625,
			z: 0.75
		},
		collisionBoundingRect: {
			vertical: 1.625,
			horizontal: 0.4375,
			bottom: 1.25,
			top: 0.875
		}
	},
	defaultPosition: {
		x: 8,
		y: 10,
		z: 20
	},
	defaultRotation: {
		pitch: 0,
		yaw: 0
	},
	viewDistance: 100,
	cookiesLastingDays: 40,
	ignoreExcessiveLag: false,
	selectionBoundOffset: 0,//0.0025,
	lights: {
		selected: 0,
		profiles: [{
			name: "Real",
			create: function(scene) {
				function addLight(name, position, intensity) {
					let light = new THREE.DirectionalLight(0xffffff,intensity);
					light.position.copy(position);
					light.name = name;
					scene.add(light);
				}
				addLight("Top", {x:0, y:1, z:0}, 2.935);
				addLight("Front", {x:0, y:0, z:-1}, 2.382)
				addLight("Back", {x:0, y:0, z:1}, 2.3548)
				addLight("Left", {x:-1, y:0, z:0}, 1.7764)
				addLight("Right", {x:1, y:0, z:0}, 1.7742)
				addLight("Bottom", {x:0, y:-1, z:0}, 1.5161)
			}
		}, {
			name: "Darker",
			create: function(scene) {
				let light1 = new THREE.DirectionalLight(0xffffff,4)
				  , light2 = new THREE.DirectionalLight(0xffffff,3.2);
				light1.position.set(3, 4, 2);
				light2.position.set(-4, -2, -3);
				scene.add(light1);
				scene.add(light2);
			}
		}, {
			name: "Contrast",
			create: function(scene) {
				let light1 = new THREE.DirectionalLight(0xffffff,4.5)
				  , light2 = new THREE.DirectionalLight(0xffffff,4);
				light1.position.set(3, 4, 2);
				light2.position.set(-4, -2, -3);
				scene.add(light1);
				scene.add(light2);
			}
		}],
		clearFrom: function(scene) {
			scene.children.forEach(function(obj) {
				if (obj instanceof THREE.DirectionalLight) {
					scene.remove(obj);
				}
			})
		},
		placeInto: function(scene) {
			if (typeof this.profiles[this.selected] !== "object")
				throw "Option Profile Error: Invalid index for light level";
			if (typeof this.profiles[this.selected].create === "function") {
				this.profiles[this.selected].create(scene);
			} else {
				this.profiles[this.selected].definition.forEach(obj=>{
					let light = new THREE.DirectionalLight(0xffffff,obj.intensity);
					light.position.copy(obj.position || obj.direction);
					scene.add(light);
				}
				)
			}
		}
	},
	init: function() {
		if (typeof getCookie === "function" && getCookie("rs_collision") === "1")
			this.ignoreCollision = true;
		if (typeof getCookie === "function" && getCookie("rs_excessiveLag") === "1")
			this.ignoreExcessiveLag = true;
	},
	save: function() {
		if (typeof setCookie === "function") {
			setCookie("rs_collision", this.ignoreCollision ? "1" : "0");
			setCookie("rs_excessiveLag", this.ignoreExcessiveLag ? "1" : "0");
		}
	}
};
//setInterval(function() { options.lights.clearFrom(scene); options.lights.placeInto(scene); },1000);
