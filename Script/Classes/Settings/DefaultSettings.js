var Settings = {
	ignoreExcessiveLag: new BooleanSetting(false),
	rendering: {
		antialiasing: new BooleanSetting(false),
		particles: {
			enabled: new BooleanSetting(true),
			quantity: new FloatSetting(0, 1, 3)
		}
	},
	camera: {
		fov: new IntegerSetting(50, 95, 150),
		adjustment: new VectorSetting(0, 0.625, 0)
	},
	keys: {
		movement: {
			forward: new KeySetting("KeyW"),
			right: new KeySetting("KeyD"),
			back: new KeySetting("KeyS"),
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
			debug: new KeySetting("KeyQ")
		}
	},
	player: {
		speed: {
			horizontal: new FloatSetting(0,0.085,1),
			vertical: new FloatSetting(0,0.105,0.2)
		},
		collision: {
			enabled: new BooleanSetting(true),
			size: new VectorSetting(0.75, 1.625, 0.75)
		}
	}
}