precision lowp float;

uniform float time;

attribute vec3 instancePosition;
attribute vec2 instanceTile;
attribute vec3 instanceVisual;

varying vec2 vUv;
varying vec2 vLightness;
varying vec2 vRelativeUv;

#define PI_HALF 1.5707963267949
#define IMAGE_SIZE_PIXELS 128.0
#define IMAGE_TILE_SIZE 8.0

mat4 translateXYZ(vec3 v) {
	return mat4(
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		v.x, v.y, v.z, 1.0
	);
}

mat4 rotateXYZ(vec3 v) {
	return mat4(
		1.0,		0,			0,			0,
		0, 			cos(v.x),	-sin(v.x),	0,
		0, 			sin(v.x),	cos(v.x),	0,
		0,			0,			0, 			1
	) * mat4(
		cos(v.z),	-sin(v.z),	0,			0,
		sin(v.z),	cos(v.z),	0,			0,
		0,			0,			1,			0,
		0,			0,			0,			1
	) * mat4(
		cos(v.y),	0,			sin(v.y),	0,
		0,			1.0,		0,			0,
		-sin(v.y),	0,			cos(v.y),	0,
		0, 			0,			0,			1
	);
}

void main() {
	vRelativeUv = uv;

	vec2 topLeftOrigin = (1.0/IMAGE_TILE_SIZE) * uv + vec2(0.0, (IMAGE_TILE_SIZE-1.)/IMAGE_TILE_SIZE);
	vUv = topLeftOrigin + vec2(1.0, -1.0) * (1.0/IMAGE_SIZE_PIXELS * (1.0 + instanceTile*2.0) + vec2(1.0 / IMAGE_TILE_SIZE) * instanceTile);

	vLightness = instanceVisual.yz;
	vec3 pos = position + instancePosition;

	mat4 toCenter = translateXYZ(-instancePosition);
	mat4 fromCenter = translateXYZ(instancePosition);

	vec3 rot;
	if (instanceVisual.x == 0.0) {
		rot = vec3(0.0, 0.0, 0.0);
	} else if (instanceVisual.x == 1.0) {
		rot = vec3(0.0, -2.0, 0.0);
	} else if (instanceVisual.x == 2.0) {
		rot = vec3(0.0, -1.0, 0.0);
	} else if (instanceVisual.x == 3.0) {
		rot = vec3(0.0, 1.0, 0.0);
	} else if (instanceVisual.x == 4.0) {
		rot = vec3(1.0, 0.0, 0.0);
	} else if (instanceVisual.x == 5.0) {
		rot = vec3(-1.0, 0.0, 0.0);
	} else {
		rot = vec3(0.0, 0.0, 0.0);
	}

	mat4 transformation = fromCenter * rotateXYZ(PI_HALF * rot) * toCenter;

	vec4 resultPos = transformation * vec4(pos, 1.0);
	gl_Position = projectionMatrix * modelViewMatrix * resultPos;
}