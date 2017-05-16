function repeat(n,f) {
	for (let i = 0 ; i < n ; i ++)
		f(i);
}

function range(a,b) {
	if (a > b) return range(b, a).reverse();
	var c = new Array(b-a);
	for (let i = a ; i <= b; i++)
		c[i-a] = i;
	return c;
}

var safeFloats = range(31,1).map(number => number.toString(2)).map(str => str.split('').reverse()).map((chars) => { var a = 0; chars.forEach((char, i)=>{ if (char==="1") { a += Math.pow(2,-(1+i)); }}); return a;}).sort((a,b)=>(a>b)?-1:(a<b)?1:0);