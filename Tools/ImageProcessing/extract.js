var state, canvas, ctx, cout, ctx1, drop, output, panX, panY, mouseX, mouseY, drawPanned, shift, target, divX, divY, extract, zoom, scrollId,requestPoints;

var radius = 7;
var pts = [];

function buttonPress() {
	requestPoints = true;
	redraw();
}

function answerRequest() {
	if (canvas.width === 0)
		return;
	var lines = createLines();
	ctx.strokeStyle = "#f00";
	ctx.lineWidth = 0.75;
	function mark(x, y) {
		ctx.moveTo(x-2,y-2);
		ctx.lineTo(x+2,y+2);
		ctx.moveTo(x-2,y+2);
		ctx.lineTo(x+2,y-2);
	};
	ctx.beginPath();
	var data = [[lines[0], lines[2], divY], [lines[1], lines[3], divX]];
	var origins = [data[0][0], data[1][0]];
	var targets = [data[0][1], data[1][1]];

	repeat(divX, x => {
		var tX = (x+0.5)/divX;
		repeat(divY, y => {
			var tY = (y+0.5)/divY;
			var start0 = {
				x: b(origins[0].start.x, origins[0].end.x, tY),
				y: b(origins[0].start.y, origins[0].end.y, tY)
			}
			var end0 = {
				x: b(targets[0].end.x, targets[0].start.x, tY),
				y: b(targets[0].end.y, targets[0].start.y, tY)
			}
			var start1 = {
				x: b(origins[1].start.x, origins[1].end.x, tX),
				y: b(origins[1].start.y, origins[1].end.y, tX)
			}
			var end1 = {
				x: b(targets[1].end.x, targets[1].start.x, tX),
				y: b(targets[1].end.y, targets[1].start.y, tX)
			}
			var unk = {
				x: b(start0.x, end0.x, tX),
				y: b(start0.y, end0.y, tX)
			}
			var real = unk;
			mark(real.x, real.y);
			//mark(b(start0.x, start1.x, 1), b(start0.y, start1.y, 1));
			//mark(end1.x, end1.y);
		});
	});
	ctx.stroke();
}

function drawLines() {
	var lines = createLines();
	ctx.lineWidth = 0.75;
	ctx.beginPath();
	lines.forEach(line=>{
		ctx.moveTo(line.start.x, line.start.y);
		ctx.lineTo(line.end.x, line.end.y);
	}
	);
	ctx.stroke();
	ctx.lineWidth = 0.25;
	ctx.beginPath();
	[[lines[0], lines[2], divY], [lines[1], lines[3], divX]].forEach((data,i)=>{
		if (i === 0 || true) {
			var origin = data[0];
			var target = data[1];
			var divNow = data[2];
			repeat(divNow, j=>{
				var t = (j) / (divNow);
				var start = {
					x: b(origin.start.x, origin.end.x, t),
					y: b(origin.start.y, origin.end.y, t)
				}
				var end = {
					x: b(target.end.x, target.start.x, t),
					y: b(target.end.y, target.start.y, t)
				}
				ctx.moveTo(start.x, start.y);
				ctx.lineTo(end.x, end.y);
			}
			);
		}
	}
	);
	ctx.stroke();
}

function extractedData(data) {
}

function init() {
	drop = document.getElementsByTagName("div")[0];
	output = document.getElementsByTagName("div")[1];
	canvas = document.getElementsByTagName("canvas")[0];
	cout = document.getElementsByTagName("canvas")[1];
	ctx = canvas.getContext('2d');
	ctx1 = cout.getContext('2d');
	canvas.width = canvas.height = cout.width = cout.height = 0;
	canvas.style.marginBottom = "16px";
	cout.style.display = "none";
	setState("waiting image");
	canvas.addEventListener("mousedown", onMouseDown);
	document.body.addEventListener("mousemove", onMouseMove);
	canvas.addEventListener("mouseup", onMouseUp);
	document.body.addEventListener("keydown", onKeyDown);
	document.body.addEventListener("keyup", onKeyUp);
	target = {
		type: "none"
	};
	divX = 16;
	divY = 16;
	document.getElementsByTagName("input")[0].value = divX;
	document.getElementsByTagName("input")[1].value = divY;
	drawPanned = function() {}
	extract = false;
	zoom = 1;
	scrollId = 0;
	document.body.addEventListener("wheel", onWheelChange);
}

function onWheelChange(ev) {
	var maxWheel = 20;
	var down = ev.deltaY > 0;
	scrollId = Math.max(-maxWheel,Math.min(maxWheel,scrollId + (down?1:-1)));
	zoom = interpolation.add(-maxWheel, 5).add(0,1).add(maxWheel,0.1).at(scrollId);
	redraw();
}

function changeInput(element, id) {
	if (id === "x")
		divX = parseFloat(element.value);
	else if (id === "y")
		divY = parseFloat(element.value);
	redraw();
}

function setState(s, extra) {
	state = s;
	if (extra)
		output.innerHTML = state + extra;
	else
		output.innerHTML = state;
}

function clear() {
	ctx.clearRect(-1, -1, canvas.width + 2, canvas.height + 2);
}

function noopHandler(ev, leaving) {
	setState("waiting image to be dropped");
	ev.stopPropagation();
	ev.preventDefault();
}

function onReadyImage(img) {
	canvas.width = 600;
	canvas.height = 500;
	var useCanvasSize = true;
	if (img.width > canvas.width || img.height > canvas.height) {
		useCanvasSize = false;
	}
	if (!pts || pts.length === 0) {
		pts = [];
		for (var i = 0; i < 4; i++)
			pts.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height
			});
	}
	panX = 0;
	panY = 0;
	drawPanned = function(x, y) {
		ctx.drawImage(img, -x, -y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
	}
	setState("ready");
	redraw();
}

function inside(pt, x, y) {
	var dist = (x - pt.x) * (x - pt.x) + (y - pt.y) * (y - pt.y);
	return ( dist < (radius + 1) * (radius + 1)) ;
}

function drawPt(pt) {
	ctx.beginPath();
	//ctx.moveTo(pt.x, pt.y);
	ctx.arc(pt.x, pt.y, radius - 1, 0, 2 * Math.PI);
	ctx.stroke();
}

function createLines() {
	var lines = [];
	for (var i = 0; i < 4; i++) {
		lines.push({
			start: {
				x: pts[i].x,
				y: pts[i].y
			},
			end: {
				x: pts[i === 3 ? 0 : i + 1].x,
				y: pts[i === 3 ? 0 : i + 1].y
			}
		});
	}
	return lines;
}

function redraw() {
	if (canvas.width === 0)
		return;
	clear();
	ctx.save();
	ctx.scale(zoom, zoom);
	drawPanned(panX, panY);
	ctx.restore();
	if (extract) {
		extract = false;
		extractedData(ctx.getImageData(0, 0, canvas.width, canvas.height));
	}
	if (requestPoints) {
		requestPoints = false;
		answerRequest();
	}
	var cursorStyle = "default";
	if (shift)
		cursorStyle = "move";
	if (pts) {
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#000";
		pts.forEach(function(obj) {
			drawPt(obj);
			if (!shift && inside(obj, mouseX, mouseY)) {
				cursorStyle = "pointer";
			}
		});
		drawLines();
	}
	canvas.style.cursor = cursorStyle;
}

function onMouseDown(ev) {
	mouseX = ev.clientX - 9;
	mouseY = ev.clientY - 9;
	if (ev.button === 0 && shift) {
		target = {
			x: mouseX,
			y: mouseY,
			type: "canvas"
		};
	} else if (ev.button === 0 && canvas.style.cursor === "pointer") {
		pts.some(function(obj) {
			if (inside(obj, mouseX, mouseY)) {
				target = obj;
				target.type = "circle";
				return true;
			}
			return false;
		})
	}
	redraw();
}

function onMouseMove(ev) {
	mouseX = ev.clientX - 9;
	mouseY = ev.clientY - 9;
	if (target.type === "canvas") {
		panX = panX - (target.x - mouseX)/zoom;
		panY = panY - (target.y - mouseY)/zoom;
		target.x = mouseX;
		target.y = mouseY;
		redraw();
	} else if (target.type === "circle") {
		target.x = mouseX + radius / 2;
		target.y = mouseY + radius / 2;
		redraw();
	} else if (mouseX < canvas.width && mouseY < canvas.height) {
		redraw();
	}
}

function onMouseUp(ev) {
	mouseX = ev.clientX - 9;
	mouseY = ev.clientY - 9;
	target.type = "none";
	redraw();
}

function onKeyDown(ev) {
	if (shift !== ev.shiftKey) {
		shift = ev.shiftKey;
		if (state === "ready")
			redraw();
	}
}
function onKeyUp(ev) {
	onKeyDown(ev);
}

function drop(ev) {
	ev.stopPropagation();
	ev.preventDefault();
	if (ev.dataTransfer.files[0]) {
		setState("reading file", "</br> File: \"" + ev.dataTransfer.files[0].name + "\"");
		var reader = new FileReader();
		reader.addEventListener("loadend", function(ev) {
			var img = document.createElement("img");
			img.src = this.result;
			img.addEventListener("load", function() {
				drop.style.display = "none";
				onReadyImage(img);
				document.body.removeChild(img);
			});
			document.body.appendChild(img);
		});
		reader.readAsDataURL(ev.dataTransfer.files[0]);
	}
}

document.body.addEventListener('dragenter', (ev)=>noopHandler(ev, false), false);
document.body.addEventListener('dragexit', (ev)=>noopHandler(ev, true), false);
document.body.addEventListener('dragover', (ev)=>noopHandler(ev, false), false);
document.body.addEventListener('drop', drop, false);

function repeat(n, f) {
	for (var i = 0; i < n; i++)
		f(i);
}

function b(i, j, k) {
	return i + (j - i) * k;
}

function ib(i,j,b) {
	return ((i - j) == 0) ? 0 : ((i - b) / (i - j))
}

Object.defineProperty(window, "interpolation", { get: function() {
	var pts = [];
	return {
		add: function(x, y) {
			pts.push([x, y]);
			return this;
		},
		_update: function() {
		},
		at: function(x) {
			if (pts.length === 1)
				return pts[0][1];
			else if (pts.length === 2)
				return b(pts[0][1], pts[1][1], ib(pts[0][0], pts[1][0], x));
			else if (pts.length === 3)
				return b(b(pts[0][1], pts[1][1], ib(pts[0][0], pts[1][0], x)),b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), ib(pts[0][0], pts[2][0], x));
			else if (pts.length === 4)
				return b(b(b(pts[0][1], pts[1][1], ib(pts[0][0], pts[1][0], x)), b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), ib(pts[0][0], pts[2][0], x)), b(b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), b(pts[2][1], pts[3][1], ib(pts[2][0], pts[3][0], x)), ib(pts[1][0], pts[3][0], x)), ib(pts[0][0], pts[3][0], x));
			else if (pts.length === 5) {
				return b(b(b(b(pts[0][1], pts[1][1], ib(pts[0][0], pts[1][0], x)), b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), ib(pts[0][0], pts[2][0], x)), b(b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), b(pts[2][1], pts[3][1], ib(pts[2][0], pts[3][0], x)), ib(pts[1][0], pts[3][0], x)), ib(pts[0][0], pts[3][0], x)),b(b(b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), b(pts[2][1], pts[3][1], ib(pts[2][0], pts[3][0], x)), ib(pts[1][0], pts[3][0], x)), b(b(pts[2][1], pts[3][1], ib(pts[2][0], pts[3][0], x)), b(pts[3][1], pts[4][1], ib(pts[3][0], pts[4][0], x)), ib(pts[2][0], pts[4][0], x)), ib(pts[1][0], pts[4][0], x)),ib(pts[0][0], pts[4][0], x));
			} else {
				this.warn();
				return 0;
			}
		},
		warn: function(len) {
			console.warn("Consider creating a more performant interpolation method. This was not made to efficiently interpolate "+ len + " points");
			this.warn = () => undefined;
		}
	}
}});