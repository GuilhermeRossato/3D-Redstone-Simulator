const selectionLinePath = [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1], [-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [1, 1, -1]];

function MinecraftSelection(scene, color) {
	let geometry = new THREE.Geometry();
	geometry.vertices = selectionLinePath.map((obj)=>new THREE.Vector3());
	let material = new THREE.LineBasicMaterial({ color: color || 0x000000 });
	this.element = new THREE.Line(geometry,material);
	this.element.name = "Selection Box";
	this.setSize(1, 1, 1);
	this.hide();
	Object.defineProperty(this, "position", {
		get: function() {
			return this.element.position;
		},
		set: function(position) {
			if (position instanceof THREE.Vector3)
				this.element.position = position;
			else
				throw "Invalid Asignment Error";
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

MinecraftSelection.prototype = {
	constructor: MinecraftSelection,
	setSizeRaw: function(x, y, z) {
		x = x / 2;
		y = y / 2;
		z = z / 2;
		selectionLinePath.forEach((vec,i)=>this.element.geometry.vertices[i].set(vec[0] * x, vec[1] * y, vec[2] * z));
		this.element.geometry.verticesNeedUpdate = true;
		this.element.geometry.computeBoundingSphere();
	},
	setSize: function(x, y, z) {
		x = options.selectionBoundOffset + x / 2;
		y = options.selectionBoundOffset + y / 2;
		z = options.selectionBoundOffset + z / 2;
		selectionLinePath.forEach((vec,i)=>this.element.geometry.vertices[i].set(vec[0] * x, vec[1] * y, vec[2] * z));
		this.element.geometry.verticesNeedUpdate = true;
		this.element.geometry.computeBoundingSphere();
	},
	copySize: function(vec) {
		this.setSize(vec.x, vec.y, vec.z);
	},
	copySizeRaw: function(vec) {
		this.setSizeRaw(vec.x, vec.y, vec.z);
	},
	show: function(x, y, z) {
		this.element.visible = true;
	},
	hide: function() {
		this.element.visible = false;
	},
	setColor: function(color) {
		this.element.material.color.set(color);
	}
}
