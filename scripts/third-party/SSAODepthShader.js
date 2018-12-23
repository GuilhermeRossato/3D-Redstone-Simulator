/**
 * @author Mugen87 / https://github.com/Mugen87
 *
 * References:
 * http://john-chapman-graphics.blogspot.com/2013/01/ssao-tutorial.html
 * https://learnopengl.com/Advanced-Lighting/SSAO
 * https://github.com/McNopper/OpenGL/blob/master/Example28/shader/ssao.frag.glsl
 */

import * as THREE from '../libs/three.module.js';

const SSAODepthShader = {
	defines: {
		"PERSPECTIVE_CAMERA": 1
	},

	uniforms: {
		"tDepth": { value: null },
		"cameraNear": { value: null },
		"cameraFar": { value: null },
	},

	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
		"	vUv = uv;",
		"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),

	fragmentShader: [
		"uniform sampler2D tDepth;",
		"uniform float cameraNear;",
		"uniform float cameraFar;",
		"varying vec2 vUv;",
		"#include <packing>",
		"float getLinearDepth( const in vec2 screenPosition ) {",
		"	#if PERSPECTIVE_CAMERA == 1",
		"		float fragCoordZ = texture2D( tDepth, screenPosition ).x;",
		"		float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );",
		"		return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );",
		"	#else",
		"		return texture2D( depthSampler, coord ).x;",
		"	#endif",
		"}",
		"void main() {",
		"	float depth = getLinearDepth( vUv );",
		"	gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );",
		"}"
	].join( "\n" )
};

export default SSAODepthShader;