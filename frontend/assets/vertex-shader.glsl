precision lowp float;

uniform float time;

attribute vec3 instancePosition;
attribute vec2 instanceTile;
attribute vec3 instanceVisual;

varying vec2 vUv;
varying float vLightness;
varying float aoChannel;
// varying vec2 vRelativeUv;
varying vec2 vAO;

#define PI_HALF_HALF 0.7853981633974483
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
// 	vRelativeUv = uv;

	vec2 topLeftOrigin = (1.0/IMAGE_TILE_SIZE) * uv + vec2(0.0, (IMAGE_TILE_SIZE-1.)/IMAGE_TILE_SIZE);
	vUv = topLeftOrigin + vec2(1.0, -1.0) * (1.0/IMAGE_SIZE_PIXELS * (1.0 + instanceTile*2.0) + vec2(1.0 / IMAGE_TILE_SIZE) * instanceTile);

	vLightness = instanceVisual.y;

	vec2 aoTile = vec2(mod(mod(instanceVisual.z, 98.0), 14.0), floor(mod(instanceVisual.z, 98.0) / 14.0));
	vAO = topLeftOrigin * vec2(0.5, 1.0) + vec2(0.5, -1.0) * (1.0/IMAGE_SIZE_PIXELS * (1.0 + aoTile*2.0) + vec2(1.0 / IMAGE_TILE_SIZE) * aoTile);
	aoChannel = floor(instanceVisual.z / 98.0);
	//vAO = topLeftOrigin + vec2(0.0, 0.0);

	vec3 pos = position + instancePosition;

	mat4 toCenter = translateXYZ(-instancePosition);
	mat4 fromCenter = translateXYZ(instancePosition);

	vec3 rot = vec3(mod(instanceVisual.x, 10.0) - 4.0, mod(floor(instanceVisual.x / 10.0), 10.0) - 4.0, mod(floor(instanceVisual.x / 100.0), 10.0) - 4.0);

	mat4 transformation = fromCenter * rotateXYZ(PI_HALF_HALF * rot) * toCenter;

	vec4 resultPos = transformation * vec4(pos, 1.0);
	gl_Position = projectionMatrix * modelViewMatrix * resultPos * 0.1;
}