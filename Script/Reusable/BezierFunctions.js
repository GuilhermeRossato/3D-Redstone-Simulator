var b = (i,j,t)=>(i + (j - i) * t)
  , ib = (i,j,b)=>((i - j) == 0) ? 0 : ((i - b) / (i - j));

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
				return b(b(pts[0][1], pts[1][1], ib(pts[0][0], pts[1][0], x)), b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), ib(pts[0][0], pts[2][0], x));
			else if (pts.length === 4)
				return b(b(b(pts[0][1], pts[1][1], ib(pts[0][0], pts[1][0], x)), b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), ib(pts[0][0], pts[2][0], x)), b(b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), b(pts[2][1], pts[3][1], ib(pts[2][0], pts[3][0], x)), ib(pts[1][0], pts[3][0], x)), ib(pts[0][0], pts[3][0], x));
			else if (pts.length === 5)
				return b(b(b(b(pts[0][1], pts[1][1], ib(pts[0][0], pts[1][0], x)), b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), ib(pts[0][0], pts[2][0], x)), b(b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), b(pts[2][1], pts[3][1], ib(pts[2][0], pts[3][0], x)), ib(pts[1][0], pts[3][0], x)), ib(pts[0][0], pts[3][0], x)),b(b(b(pts[1][1], pts[2][1], ib(pts[1][0], pts[2][0], x)), b(pts[2][1], pts[3][1], ib(pts[2][0], pts[3][0], x)), ib(pts[1][0], pts[3][0], x)), b(b(pts[2][1], pts[3][1], ib(pts[2][0], pts[3][0], x)), b(pts[3][1], pts[4][1], ib(pts[3][0], pts[4][0], x)), ib(pts[2][0], pts[4][0], x)), ib(pts[1][0], pts[4][0], x)),ib(pts[0][0], pts[4][0], x));
			else {
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

function interpolate(pt0, pt1, pt2, pt3) {
	ret = {};
	if (typeof pt0 === "number")
		console.warn("EXPECTED ARRAY!!");
	if (typeof pt2 === "undefined")
		ret.at = x=>b(pt0[1], pt1[1], ib(pt0[0], pt1[0], x));
	else if (typeof pt3 === "undefined")
		ret.at = x=>b(b(pt0[1], pt1[1], ib(pt0[0], pt1[0], x)), b(pt1[1], pt2[1], ib(pt1[0], pt2[0], x)), ib(pt0[0], pt2[0], x));
	else
		ret.at = x=>b(b(b(pt0[1], pt1[1], ib(pt0[0], pt1[0], x)), b(pt1[1], pt2[1], ib(pt1[0], pt2[0], x)), ib(pt0[0], pt2[0], x)), b(b(pt1[1], pt2[1], ib(pt1[0], pt2[0], x)), b(pt2[1], pt3[1], ib(pt2[0], pt3[0], x)), ib(pt1[0], pt3[0], x)), ib(pt0[0], pt3[0], x));
	return ret;
}
