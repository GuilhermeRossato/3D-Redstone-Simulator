var options = {
	playerSpeed: {
		horizontal: 0.075,
		vertical: 0.105
	},
	viewDistance: 50,
	cookiesLastingDays: 40,
	collisionBoundingRect: {
		vertical: 0.46875,
		horizontal: 0.46875
	},
	lights: {
		selected: 0,
		profiles: [{
			name: "Real",
			create: function(scene) {
				[{
					// Top
					direction: new THREE.Vector3(0,1,0),
					intensity: 2.935
				}, {
					// Front
					direction: new THREE.Vector3(0,0,-1),
					intensity: 2.382
				}, {
					// Back
					direction: new THREE.Vector3(0,0,1),
					intensity: 2.3548
				}, {
					// Left
					direction: new THREE.Vector3(-1,0,0),
					intensity: 1.7764
				}, {
					// Right
					direction: new THREE.Vector3(1,0,0),
					intensity: 1.7742
				}, {
					// Bottom
					direction: new THREE.Vector3(0,-1,0),
					intensity: 1.5161
				}].forEach(obj=>{
					let light = new THREE.DirectionalLight(0xffffff,obj.intensity);
					light.position.copy(obj.direction);
					scene.add(light);
				}
				);
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
			if (typeof this.profiles[this.selected].create === "function") {
				this.profiles[this.selected].create(scene);
			} else {
				this.profiles[this.selected].definition.forEach(obj=>{
					let light = new THREE.DirectionalLight(0xffffff,obj.intensity);
					light.position.copy(obj.position);
					scene.add(light);
				}
				)
			}
		}
	},
	selectionBoundSpace: 1.005
};
//setInterval(function() { options.lights.clearFrom(scene); options.lights.placeInto(scene); },1000);
