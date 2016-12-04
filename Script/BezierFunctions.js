var b = (i,j,t)=>(i + (j - i) * t)
  , ib = (i,j,b)=>((i - j) == 0) ? 0 : ((i - b) / (i - j));
  
function interpolate(pt0, pt1, pt2) {
	ret = {};
	if (typeof pt2 === "undefined")
		ret.at = x=>b(pt0[1], pt1[1], ib(pt0[0], pt1[0], x));
	else
		ret.at = x=>b(b(pt0[1], pt1[1], ib(pt0[0], pt1[0], x)), b(pt1[1], pt2[1], ib(pt1[0], pt2[0], x)), ib(pt0[0], pt2[0], x));
	return ret;
}
