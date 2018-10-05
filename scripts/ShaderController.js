'use strict';

export default class ShaderController {
	constructor() {
	}
	async load(filename) {
		let response = await fetch(filename, {
			method: 'get',
			mode: 'cors',
			cache: 'no-store'
		});
		return (await response.text()).trim();
	}
	async build(gl, source) {
		const shader = gl.createShader(
			source.contains("gl_FragColor")?gl.FRAGMENT_SHADER:gl.VERTEX_SHADER
		);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const log = gl.getShaderInfoLog(shader);
			const shaderType = (source.contains("gl_FragColor")?"Fragment Shader":"Vertex Shader")
			gl.deleteShader(shader);
			throw new Error("Could not build "+shaderType+": \n"+log);
		}
		return shader;
	}
	join(gl, vertexShader, fragmentShader) {
		const shaderProgram = gl.createProgram();
		if (!(vertexShader instanceof WebGLShader)) {
			throw new TypeError("Cannot build shader program because the second parameter is not a valid WebGLShader");
		}
		if (!(fragmentShader instanceof WebGLShader)) {
			throw new TypeError("Cannot build shader program because the third parameter is not a valid WebGLShader");
		}
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			const log = gl.getProgramInfoLog(shaderProgram);
			throw new Error("Unable to initialize the shader program: "+log);
		}
		return shaderProgram;
	}
}