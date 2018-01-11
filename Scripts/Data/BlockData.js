define(()=>[{
	name: "Stone",
	texture: {
		type: "single-variable",
		children: [
			"stone0.png",
			"stone1.png",
			"stone2.png",
			"stone3.png",
			"stone4.png",
			"stone5.png",
			"stone6.png",
			"stone7.png",
			"stone8.png",
			"stone9.png",
			"stone10.png"
		]
	}
}, {
	name: "Stone Brick",
	texture: {
		type: "single",
		children: [
			"stonebrick.png"
		]
	}
}, {
	name: "Log",
	texture: {
		type: "directional",
		children: {
			top: "log-top.png",
			sides: "log-sides.png",
			bottom: "log-bottom.png"
		}
	}
}]);