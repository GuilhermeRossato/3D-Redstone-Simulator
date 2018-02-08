define([
	"Scripts/Classes/Loading/LoadingStep.js",
	"Scripts/Data/VertexShader.js",
	"Scripts/Data/FragmentShader.js",
], (LoadingStep, VertexShader, FragmentShader) =>
class WebGLSystem extends LoadingStep {
	constructor(imageUrl) {
		super();
		this.vertices = [
			-0.5,0.5,0.0,
			-0.5,-0.5,0.0,
			0.5,-0.5,0.0,
			0.5,0.5,0.0
		];
		this.indices = [3,2,1,3,1,0];
	}
	createShaders() {
		var vertCode = VertexShader.create();

		// Create a vertex shader object
		var vertShader = gl.createShader(gl.VERTEX_SHADER);

		// Attach vertex shader source code
		gl.shaderSource(vertShader, vertCode);

		// Compile the vertex shader
		gl.compileShader(vertShader);

		// Fragment shader source code
		var fragCode = FragmentShader.create();
		// Create fragment shader object 
		var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

		// Attach fragment shader source code
		gl.shaderSource(fragShader, fragCode);

		// Compile the fragment shader
		gl.compileShader(fragShader);
		return {fragment: fragShader, vertex: vertShader};

	}
	async load() {
		// Create an empty buffer object to store vertex buffer
		var vertex_buffer = gl.createBuffer();

		// Bind appropriate array buffer to it
		gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

		// Pass the vertex data to the buffer
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		// Unbind the buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		// Create an empty buffer object to store Index buffer
		var Index_Buffer = gl.createBuffer();

		// Bind appropriate array buffer to it
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

		// Pass the vertex data to the buffer
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

		// Unbind the buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		/*====================== Shaders =======================*/
		var shaders = this.createShaders();
		var shaderProgram = gl.createProgram();

		// Attach a vertex shader
		gl.attachShader(shaderProgram, shaders.vertex);

		// Attach a fragment shader
		gl.attachShader(shaderProgram, shaders.fragment);

		// Link both the programs
		gl.linkProgram(shaderProgram);

		// Use the combined shader program object
		gl.useProgram(shaderProgram);

		/* ======= Associating shaders to buffer objects =======*/

		// Bind vertex buffer object
		gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

		// Bind index buffer object
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer); 

		// Get the attribute location
		var coord = gl.getAttribLocation(shaderProgram, "coordinates");

		// Point an attribute to the currently bound VBO
		gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

		// Enable the attribute
		gl.enableVertexAttribArray(coord);

		this.emit("progress", 1);
	}
});
