var imgs, canvas, ctx, div, state, data;

function processData(imageData) {
	var interp = interpolation.add(1,0).add(33, 71).add(44,98);
	console.log(imageData.data.length);
	imageData.data.forEach((dt,i) => {
		if (i%4===3) {
			var value = Math.max(0, Math.min(255, interp.at(imageData.data[i])));
			imageData.data[i] = value|0;
		} else {
			imageData.data[i] = 0;
		}
	});
	return imageData;
}

function init() {
	imgs = new Array(...document.getElementsByTagName("img"));
	canvas = document.getElementsByTagName("canvas")[0];
	ctx = canvas.getContext('2d');
	div = document.getElementsByTagName("div")[0];
	canvas.width = imgs[0].width;
	canvas.height = imgs[0].height;
	data = [];
	state = "init";
}

function clear() {
	ctx.clearRect(-1,-1,canvas.width+2,canvas.height+2);
}

function drawImage(img) {
	ctx.drawImage(img, 0, 0);
}

var unprocessedData, processedData;

function press() {
	if (state == "init") {
		clear();
		drawImage(imgs[0]);
		div.innerText = state = "waiting to get image data";
	} else if (state == "waiting to get image data") {
		unprocessedData = ctx.getImageData(0,0,canvas.width, canvas.height);
		div.innerText = state = "ready to process";
	} else if (state == "ready to process") {
		div.innerText = state = "processed";
		processedData = processData(unprocessedData);
	} else if (state == "processed") {
		clear();
		ctx.putImageData(processedData, 0, 0);
		div.innerText = " -- DONE -- ";
	}
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