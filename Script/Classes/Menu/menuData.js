// Material icons source: https://materialdesignicons.com/
const menu_structure = [{
	name: "Cursor",
	iconImage: "border-color.png",
	state: false,
	group: 1,
	init: function() {
		if ((!(getCookie instanceof Function)) || getCookie("tool") == "0" || typeof getCookie("tool") !== "string")
			this.state = true;
	},
	onclick: function() {
		this.state = !this.state;
		this.hold(this.state ? "down" : "up");
		if (this.state && setCookie instanceof Function)
			setCookie("tool", "0", 31);
	}
}, {
	name: "Select",
	iconImage: "vector-selection.png",
	state: false,
	group: 1,
	init: function() {
		if (getCookie instanceof Function)
			this.state = (getCookie("tool") === "1");
	},
	onclick: function() {
		this.state = !this.state;
		this.hold(this.state ? "down" : "up");
		if (this.state && setCookie instanceof Function)
			setCookie("tool", "1", 31);
	}
}, {
	name: "Move",
	iconImage: "cursor-move.png",
	state: false,
	group: 1,
	init: function() {
		if (getCookie instanceof Function)
			this.state = (getCookie("tool") === "2");
	},
	onclick: function() {
		this.state = !this.state;
		this.hold(this.state ? "down" : "up");
		if (this.state && setCookie instanceof Function)
			setCookie("tool", "2", 31);
	}
}, {
	name: "Clone",
	iconImage: "content-copy.png",
	state: false,
	disabled: true,
	group: 1,
	onclick: function() {
		this.state = !this.state;
		this.hold(this.state ? "down" : "up");
	}
}, {
	name: "Insert",
	iconImage: "plus.png",
	state: false,
	disabled: true,
	group: 1,
	onclick: function() {
		this.state = !this.state;
		this.hold(this.state ? "down" : "up");
	}
}, {
	name: "Remove",
	disabled: true,
	iconImage: "content-cut.png"
}, {
	name: "Undo",
	disabled: true,
	iconImage: "undo-variant.png"
}, {
	name: "Redo",
	disabled: true,
	iconImage: "redo-variant.png"
}, {
	name: "Time Control",
	iconImage: "clock.png",
	state: false,
	group: 2,
	onclick: function() {
		this.state = !this.state;
		this.hold(this.state ? "down" : "up");
		if (this.state) {
			this.parent.openSubmenu(this.submenu);
		} else {
			this.parent.closeSubmenu();
		}
	},
	submenu: [{
		name: "Stop",
		iconImage: "stop.png",
		state: false,
		group: 3,
		init: function() {
			if (getCookie instanceof Function)
				this.state = (getCookie("playing") === "1");
		},
		onclick: function() {
			this.state = !this.state;
			this.hold(this.state ? "down" : "up");
			this.changeLabel(this.state ? "Play" : "Stop");
			this.changeIcon(this.state ? "play.png" : "stop.png");
			if (setCookie instanceof Function)
				setCookie("playing", this.state ? "1" : "0", 31);
		}
	}, {
		name: "Step",
		iconImage: "step-forward.png"
	}, {
		name: "Double Step",
		iconImage: "step-forward-2.png"
	}]
}, {
	name: "Flip and Rotate",
	//icon: "transform",
	iconImage: "crop-rotate.png",
	state: false,
	group: 2,
	onclick: function() {
		this.state = !this.state;
		this.hold(this.state ? "down" : "up");
		if (this.state) {
			this.parent.openSubmenu(this.submenu);
		} else {
			this.parent.closeSubmenu();
		}
	},
	submenu: [{
		name: "Flip X",
		iconImage: "swap-horizontal.png"
	}, {
		name: "Flip Y",
		iconImage: "swap-vertical.png"
	}, {
		name: "Flip Z",
		iconImage: "swap-horizontal.png"
	}, {
		name: "Rotate Left",
		iconImage: "rotate-left.png"
	}, {
		name: "Rotate Right",
		iconImage: "rotate-right.png"
	}]
}, {
	name: "Presets",
	iconImage: "folder-download.png",
	state: false,
	group: 2,
	onclick: function() {
		this.state = !this.state;
		if (this.state) {
			this.hold("down");
			this.parent.openSubmenu(this.submenu);
		} else {
			this.hold("up");
			this.parent.closeSubmenu();
		}
	},
	submenu: [{
		name: "Clear",
		iconImage: "numeric-0-box.png",
		onclick: function() {}
	}, {
		name: "NOR</br>Latch",
		iconImage: "numeric-1-box.png",
		onclick: function() {}
	}, {
		name: "Binary Counter",
		iconImage: "numeric-2-box.png",
		onclick: function() {}
	}, {
		name: "Segmented Display",
		iconImage: "numeric-3-box.png",
		onclick: function() {}
	}, {
		name: "Piston Engine",
		iconImage: "numeric-4-box.png",
		onclick: function() {}
	}]
}, {
	name: "Settings",
	state:false,
	group: 2,
	iconImage: "settings.png",
	onclick: function() {
		this.state = !this.state;
		if (this.state) {
			this.hold("down");
			this.parent.closeSubmenu();
		} else {
			this.hold("up");
			this.parent.closeSubmenu();
		}
	}
}];
