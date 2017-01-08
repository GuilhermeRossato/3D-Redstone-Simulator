var options = {
	playerSpeed: {
		horizontal: 0.075,
		vertical: 0.105
	},
	viewDistance: 50,
	cookiesLastingDays: 40,
	collisionBoundingRect: {
		vertical: 0.45,
		horizontal: 0.45
	},
	lights: {
		instances: [],
		selected: 0,
		profiles: [{
			name: "Darker",
			definition: [{
				intensity: 4,
				position: new THREE.Vector3(3,4,2)
			}, {
				intensity: 3.2,
				position: new THREE.Vector3(-4,-2,-3)
			}]
		}, {
			name: "Contrast",
			definition: [{
				intensity: 4.5,
				position: new THREE.Vector3(3,4,2)
			}, {
				intensity: 4,
				position: new THREE.Vector3(-4,-2,-3)
			}]
		}],
		clearFrom: function(scene) {
			scene.children.forEach(function(obj) {
				if (obj instanceof THREE.DirectionalLight) {
					scene.remove(obj);
				}
			})
		},
		placeInto: function(scene) {
			this.profiles[this.selected].definition.forEach(obj=>{
				let light = new THREE.DirectionalLight(0xffffff,obj.intensity);
				light.position.copy(obj.position);
				scene.add(light);
				this.instances.push(light);
			}
			)
		}
	},
	selectionBoundSpace: 1.005
};
//setInterval(function() { options.lights.clearFrom(scene); options.lights.placeInto(scene); },1000);
