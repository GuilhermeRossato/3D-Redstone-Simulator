function SpacialSelection(scene) {
	this.start = new MinecraftSelection(scene, 0x807F33);
	this.middle = new MinecraftSelection(scene, 0xCC3333);
	this.end = new MinecraftSelection(scene, 0x80337F);
	this.state = 0;
}

SpacialSelection.prototype = {
	constructor: SpacialSelection,
	clear: function() {
		this.start.hide();
		this.end.hide();
	},
	setStart: function(x,y,z) {
		this.start.position.set(x,y,z);
		this.start.show();
		this.updateMiddle();
	},
	setEnd: function(x,y,z) {
		this.end.position.set(x,y,z);
		this.end.show();
		this.updateMiddle();
	},
	updateMiddle: function() {
		if (this.start.visible && this.end.visible) {
			let deltaX = Math.abs(this.start.position.x - this.end.position.x)
			, deltaY = Math.abs(this.start.position.y - this.end.position.y)
			, deltaZ = Math.abs(this.start.position.z - this.end.position.z);
			this.middle.setSize(deltaX, deltaY, deltaZ);
		}
	},
	getString: function() {
		str = "";
		return str;
	},
	setString: function(str) {
		
	}
}