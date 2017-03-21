function SpacialHighlight(scene, color, size, texture) {
	let geometry, material;
	geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(0,0,0));
	if (texture) {
		material = new THREE.PointsMaterial({ color: color || 0x000000, size: size || 4, map: (new THREE.TextureLoader()).load(texture), blending: THREE.AdditiveBlending, transparent: true });
		material.alphaTest = 0.5;
	} else {
		material = new THREE.PointsMaterial({ color: color || 0x000000, size: size || 4 });
	}
	this.element = new THREE.Points(geometry, material);
	this.hide();
	Object.defineProperty(this, "position", {
		get: function() {
			return this.element.position;
		}
	});
	Object.defineProperty(this, "visible", {
		get: function() {
			return this.element.visible;
		},
		set: function(value) {
			return this.element.visible = value?true:false;
		}
	});
	scene.add(this.element);
}

SpacialHighlight.prototype = {
	constructor: SpacialHighlight,
	set: function(elements) {
		this.element.geometry.vertices = elements;
		this.update();
	},
	copy: function(elements) {
		this.element.geometry.vertices = elements.map((element) => (element instanceof THREE.Vector3)?element:new THREE.Vector3(element.x, element.y, element.z));
		this.update();
	},
	show: function(x, y, z) {
		this.element.visible = true;
	},
	hide: function() {
		this.element.visible = false;
	},
	setColor: function(color) {
		this.element.material.color.set(color);
	},
	setParticleSize: function(size) {
		this.element.material.size = size;
	}
}
