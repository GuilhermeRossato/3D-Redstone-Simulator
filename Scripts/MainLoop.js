window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || ((callback) => window.setTimeout(callback, 1000 / 60));

const MainLoop = (function() {

	var canvas;

	var lastEvent;

	var draw;

	function init(element) {
		canvas = element;
		window.addEventListener("resize", resize);
		lastEvent = performance.now();
		window.requestAnimFrame(update);
	}

	function resize() {
		
	}

	function update() {
		var deltaMS = leftover-(holdThis.lastEvent - (holdThis.lastEvent = performance.now()));
		
	}

	return {
		setCanvas: function(element) {
			if (!element) throw Error("Invalid canvas element");
			init(element);
			this.setCanvas = undefined;
		},
		setDraw: function(func) {
			if (!(func instanceof Function)) throw Error("Invalid draw function callback");
			draw = func;
			this.setDraw = undefined;
		}
	}
})();