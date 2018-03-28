define([], ()=>({
toGLFloat: (v) => (typeof v === "number" && v === v|0)?((v|0)+".0"):(typeof v === "number"?v.toFixed(4):"0.00"),
create: (transparency = 1) => `
	precision mediump float;
	attribute vec3 coordinates;
	void main(void) {
		gl_Position = vec4(coordinates, ${transparency.toFixed(4)});
	}
`}));