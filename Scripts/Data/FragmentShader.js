define([], ()=>({
toGLFloat: (v) => (typeof v === "number" && v === v|0)?((v|0)+".0"):(typeof v === "number"?v.toFixed(4):"0.00"),
create: () => `
	precision mediump float;
	void main(void) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);
	}
`}));