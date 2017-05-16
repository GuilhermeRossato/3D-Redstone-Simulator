var Settings = {
	options: {
		textureId: new IntegerSetting(0,1,0)
	},
	cookie: {
		enabled: new BooleanSetting(true),
		lastingDays: new IntegerSetting(1,365,30)
	},
	performance: {
		compactPerformancer: new BooleanSetting(true),
		delayedLoading: new BooleanSetting(false),
		ignoreExcessiveLag: new BooleanSetting(false)
	},
	rendering: {
		antialiasing: new BooleanSetting(false),
		particles: {
			enabled: new BooleanSetting(true),
			quantity: new FloatSetting(0,3,1)
		}
	},
	camera: {
		fov: new IntegerSetting(50,150,95),
		adjustment: new VectorSetting(0,0.625,0),
		sensitivityX: new FloatSetting(0,3,1.2),
		sensitivityY: new FloatSetting(0,3,1.4)
	},
	keys: {
		movement: {
			forward: new KeySetting("KeyW"),
			right: new KeySetting("KeyD"),
			backward: new KeySetting("KeyS"),
			left: new KeySetting("KeyA"),
			up: new KeySetting("Space"),
			down: new KeySetting("ShiftLeft")
		},
		file: {
			save: new KeySetting("KeyS"),
			load: new KeySetting("KeyO")
		},
		control: {
			ignoreLag: new KeySetting("KeyM")
		},
		other: {
			inventory: new KeySetting("KeyE"),
			debug: new KeySetting("KeyQ"),
			collision: new KeySetting("KeyB")
		}
	},
	player: {
		speed: {
			horizontal: new FloatSetting(0,1,0.085),
			vertical: new FloatSetting(0,0.2,0.105)
		},
		position: new VectorSetting(10,10,10),
		rotation: {
			pitch: new FloatSetting(0,0,-0.7),
			yaw: new FloatSetting(0,0,0.7)
		},
		collision: {
			enabled: new BooleanSetting(true),
			size: new VectorSetting(0.75,1.625,0.75),
			showBoundingBox: new BooleanSetting(false)
		}
	}
}
