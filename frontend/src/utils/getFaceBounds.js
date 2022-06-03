import * as THREE from '../libs/three.module.js';
import SIDE_DISPLACEMENT from '../data/SideDisplacement.js';
const PI_HALF_HALF = Math.PI / 4;

function getFaceUpDirection(rotationId) {
	const rz = Math.floor(rotationId) % 10;
	const ry = Math.floor(rotationId / 10) % 10;
	const rx = Math.floor(rotationId / 100) % 10;
	
	const v = new THREE.Vector3(0, 1, 0);
	if (rx === 4 && rz === 4) {
		// Rotation around the y axis (x,z plane)
	} else if (rx === 4) {
		// Rotation around the x,y plane or a combination with y
		v.applyAxisAngle({x: -1, y: 0, z: 0}, (rz - 4) * PI_HALF_HALF);
	} else if (rz === 4) {
		// Rotation around the y,z plane or a combination with y
		v.applyAxisAngle({x: 0, y: 0, z: -1}, (rx - 4) * PI_HALF_HALF);
	} else {
		throw new Error('Unknown rotation id: ' + rotationId + ' (' + rx + ', ' + ry + ', ' + rz + ')');
	}
	return v;
}

function getFaceRightDirection(rotationId) {
	const rz = (Math.floor(rotationId) % 10);
	const ry = (Math.floor(rotationId / 10) % 10);
	const rx = (Math.floor(rotationId / 100) % 10);
	
	const v = new THREE.Vector3(-1, 0, 0);
	if (rx === 4 && ry === 4) {
		// Rotation around the x,y plane (do nothing)
	} else if (rx === 4 && rz === 4) {
		// Rotation around the y axis (x,z plane)
		v.applyAxisAngle({x: 0, y: -1, z: 0}, (ry - 4) * PI_HALF_HALF);
	} else if (ry === 4 && rz === 4) {
		// Rotation around the y,z plane
		v.applyAxisAngle({x: 0, y: 0, z: -1}, (rx - 4) * PI_HALF_HALF);
	} else {
		throw new Error('Unknown rotation id: ' + rotationId + ' (' + rx + ', ' + ry + ', ' + rz + ')');
	}
	return v;
}

/**
 * @param {{x: number, y: number, z: number, rotationId: number}} face
 * @param {number} cx
 * @param {number} cy
 * @param {number} cz
 */
export default function getFaceBounds(face, cx = 0, cy = 0, cz = 0) {
	if (face.ref.data.isTorch) {
		throw new Error('Unimplemented');
	} else if (face.ref.data.isRedstone) {
		throw new Error('Unimplemented');
	}
	const up = getFaceUpDirection(face.rotationId);
	const right = getFaceRightDirection(face.rotationId);
	const corners = [
		{x: cx * 16 + face.x + (up.x + right.x) / 2, y: cy * 16 + face.y + (up.y + right.y) / 2, z: cz * 16 + face.z + (up.z + right.z) / 2},
		{x: cx * 16 + face.x + (up.x - right.x) / 2, y: cy * 16 + face.y + (up.y - right.y) / 2, z: cz * 16 + face.z + (up.z - right.z) / 2},
		{x: cx * 16 + face.x + (-up.x - right.x) / 2, y: cy * 16 + face.y + (-up.y - right.y) / 2, z: cz * 16 + face.z + (-up.z - right.z) / 2},
		{x: cx * 16 + face.x + (-up.x + right.x) / 2, y: cy * 16 + face.y + (-up.y + right.y) / 2, z: cz * 16 + face.z + (-up.z + right.z) / 2}
	];
	return corners;
}