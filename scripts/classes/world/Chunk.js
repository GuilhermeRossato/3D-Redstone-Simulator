'use strict';

import * as THREE from '../../../scripts/third-party/three.module.js';
import TextureService from '../../graphics/TextureService.js';
import GraphicsEngine from '../../graphics/GraphicsEngine.js';
import BlockData from '../../data/BlockData.js';
import WorldHandler from './WorldHandler.js';
import SIDE_DISPLACEMENT from '../../graphics/SideDisplacement.js';
import WorldBlock from './WorldBlock.js';
import World from '../../World.js';

const primitive = new THREE.PlaneBufferGeometry(1, 1);

/** @type {Record<number, {id: number, rot: number}>} */
const redstoneTextureLookup = {
	0: {id: 0, rot: 446},
	1: {id: 1, rot: 646},
	2: {id: 1, rot: 646},
	3: {id: 1, rot: 646},
	4: {id: 1, rot: 446},
	5: {id: 3, rot: 446},
	6: {id: 3, rot: 646},
	7: {id: 2, rot: 646},
	8: {id: 1, rot: 446},
	9: {id: 3, rot: 246},
	10: {id: 3, rot: 846},
	11: {id: 2, rot: 246},
	12: {id: 1, rot: 446},
	13: {id: 2, rot: 446},
	14: {id: 2, rot: 846},
	15: {id: 0, rot: 446}
};

export default class Chunk {

	/**
	 * @param {GraphicsEngine} graphics
	 * @param {WorldHandler} world
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} cz
	 */
	constructor(graphics, world, cx, cy, cz) {
		this.graphics = graphics;
		this.world = world;
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;

		/** @type {Record<number, Record<number, Record<number, WorldBlock>>>} */
		this.blocks = [];
		/** @type {WorldBlock[]} */
		this.blockList = [];
		/** @type {THREE.Mesh} */
		this.mesh = undefined;

		this.rebuildMesh = this.rebuildMesh.bind(this);
	}

	/**
	 * @param {THREE.Scene} scene
	 */
	assignTo(scene) {
		this.scene = scene;
		if (this.blockList.length !== 0) {
			return this.requestMeshUpdate();
		}
		return null;
	}

	/**
	 * @param {number} gx global position
	 * @param {number} gy
	 * @param {number} gz
	 * @param {number} side
	 */
	_getOcclusionId(gx, gy, gz, side) {
		let t, tr, r, br, b, bl, l, tl;
		const world = this.world;

		if (side === 0) {
			t = world.isSolidBlock(gx, gy+1, gz+1);
			r = world.isSolidBlock(gx+1, gy, gz+1);
			b = world.isSolidBlock(gx, gy-1, gz+1);
			l = world.isSolidBlock(gx-1, gy, gz+1);
			tr = world.isSolidBlock(gx+1, gy+1, gz+1);
			br = world.isSolidBlock(gx+1, gy-1, gz+1);
			bl = world.isSolidBlock(gx-1, gy-1, gz+1);
			tl = world.isSolidBlock(gx-1, gy+1, gz+1);
		} else if (side === 1) {
			t = world.isSolidBlock(gx, gy+1, gz-1);
			r = world.isSolidBlock(gx-1, gy, gz-1);
			b = world.isSolidBlock(gx, gy-1, gz-1);
			l = world.isSolidBlock(gx+1, gy, gz-1);
			tr = world.isSolidBlock(gx-1, gy+1, gz-1);
			br = world.isSolidBlock(gx-1, gy-1, gz-1);
			bl = world.isSolidBlock(gx+1, gy-1, gz-1);
			tl = world.isSolidBlock(gx+1, gy+1, gz-1);
		} else if (side === 2) {
			t = world.isSolidBlock(gx+1, gy+1, gz);
			r = world.isSolidBlock(gx+1, gy, gz-1);
			b = world.isSolidBlock(gx+1, gy-1, gz);
			l = world.isSolidBlock(gx+1, gy, gz+1);
			tr = world.isSolidBlock(gx+1, gy+1, gz-1);
			br = world.isSolidBlock(gx+1, gy-1, gz-1);
			bl = world.isSolidBlock(gx+1, gy-1, gz+1);
			tl = world.isSolidBlock(gx+1, gy+1, gz+1);
		} else if (side === 3) {
			t = world.isSolidBlock(gx-1, gy+1, gz);
			r = world.isSolidBlock(gx-1, gy, gz+1);
			b = world.isSolidBlock(gx-1, gy-1, gz);
			l = world.isSolidBlock(gx-1, gy, gz-1);
			tr = world.isSolidBlock(gx-1, gy+1, gz+1);
			br = world.isSolidBlock(gx-1, gy-1, gz+1);
			bl = world.isSolidBlock(gx-1, gy-1, gz-1);
			tl = world.isSolidBlock(gx-1, gy+1, gz-1);
		} else if (side === 4) {
			t = world.isSolidBlock(gx, gy+1, gz-1);
			r = world.isSolidBlock(gx+1, gy+1, gz);
			b = world.isSolidBlock(gx, gy+1, gz+1);
			l = world.isSolidBlock(gx-1, gy+1, gz);
			tr = world.isSolidBlock(gx+1, gy+1, gz-1);
			br = world.isSolidBlock(gx+1, gy+1, gz+1);
			bl = world.isSolidBlock(gx-1, gy+1, gz+1);
			tl = world.isSolidBlock(gx-1, gy+1, gz-1);
			if (t || r || b || l) {
				//debugger;
			}
		} else if (side === 5) {
			t = world.isSolidBlock(gx, gy-1, gz+1);
			r = world.isSolidBlock(gx+1, gy-1, gz);
			b = world.isSolidBlock(gx, gy-1, gz-1);
			l = world.isSolidBlock(gx-1, gy-1, gz);
			tr = world.isSolidBlock(gx+1, gy-1, gz+1);
			br = world.isSolidBlock(gx+1, gy-1, gz-1);
			bl = world.isSolidBlock(gx-1, gy-1, gz-1);
			tl = world.isSolidBlock(gx-1, gy-1, gz+1);
		} else {
			return 0;
		}

		// @ts-ignore
		return tl + t * 2 + tr * 4 + (r + (br + (b + (bl + l * 2) * 2) * 2) * 2) * 8;
	}

	getFaces(skipAo = false, skipFaceOcclusion = false) {
		/** @type {{ref: WorldBlock, x: number, y: number, z: number, rotationId: number, lightness: number, occlusionId: number, textureX: number, textureY:number}[]} */
		const faces = [];
		for(let i = this.blockList.length-1; i >= 0; i--) {
			const block = this.blockList[i];
			const gx = this.cx * 16 + block.x;
			const gy = this.cy * 16 + block.y;
			const gz = this.cz * 16 + block.z;

			const sides = typeof block.data.faceCount === "number" ? block.data.faceCount : 6;
			const texture = block.texture;

			for (let j = 0; j < sides; j++) {
				if (!skipFaceOcclusion || block.data.isSolid !== false) {
					const inverseBlock = this.world.get(gx + SIDE_DISPLACEMENT[j].inverse[0], gy + SIDE_DISPLACEMENT[j].inverse[1], gz + SIDE_DISPLACEMENT[j].inverse[2]);
					if (inverseBlock && inverseBlock.data.isSolid !== false) {
						continue;
					}
				}

				let faceTexture = texture;
				let rotationId;
				if (block.data.isRedstone) {
					const rightBlock = this.world.get(gx + 1, gy, gz);
					const rightAboveBlock = (!rightBlock || !rightBlock.data.isRedstone) ? this.world.get(gx + 1, gy + 1, gz) : null;
					const rightBelowBlock = !rightBlock ? this.world.get(gx + 1, gy - 1, gz) : null;

					const leftBlock = this.world.get(gx - 1, gy, gz);
					const leftAboveBlock = (!leftBlock || !leftBlock.data.isRedstone) ? this.world.get(gx - 1, gy + 1, gz) : null;
					const leftBelowBlock = !leftBlock ? this.world.get(gx - 1, gy - 1, gz) : null;

					const upBlock = this.world.get(gx, gy, gz - 1);
					const upAboveBlock = (!upBlock || !upBlock.data.isRedstone) ? this.world.get(gx, gy + 1, gz - 1) : null;
					const upBelowBlock = !upBlock ? this.world.get(gx, gy - 1, gz - 1) : null;

					const downBlock = this.world.get(gx, gy, gz + 1);
					const downAboveBlock = (!downBlock || !downBlock.data.isRedstone) ? this.world.get(gx, gy + 1, gz + 1) : null;
					const downBelowBlock = !downBlock ? this.world.get(gx, gy - 1, gz + 1) : null;

					const aboveBlock = this.world.get(gx, gy + 1, gz);

					const rRed = (rightBlock && rightBlock.data.isRedstone) || (rightAboveBlock && rightAboveBlock.data.isRedstone && !aboveBlock) || (rightBelowBlock && rightBelowBlock.data.isRedstone);
					const lRed = (leftBlock && leftBlock.data.isRedstone) || (leftAboveBlock && leftAboveBlock.data.isRedstone && !aboveBlock) || (leftBelowBlock && leftBelowBlock.data.isRedstone);
					const uRed = (upBlock && upBlock.data.isRedstone) || (upAboveBlock && upAboveBlock.data.isRedstone && !aboveBlock) || (upBelowBlock && upBelowBlock.data.isRedstone);
					const dRed = (downBlock && downBlock.data.isRedstone) || (downAboveBlock && downAboveBlock.data.isRedstone && !aboveBlock) || (downBelowBlock && downBelowBlock.data.isRedstone);
					const lookupId = (rRed ? 8 : 0) + (lRed ? 4 : 0) + (uRed ? 2 : 0) + (dRed ? 1 : 0);
					if (!redstoneTextureLookup[lookupId]) {
						faceTexture = texture[0];
						rotationId = 446;
						console.warn("Unknown texture for " + lookupId + " at ", gx, gy, gz);
					} else {
						console.log(lookupId);
						faceTexture = texture[redstoneTextureLookup[lookupId].id];
						rotationId = redstoneTextureLookup[lookupId].rot;
					}
				} else {
					rotationId = SIDE_DISPLACEMENT[block.data.isRedstone ? 4 : j].rotationId;
					if (faceTexture instanceof Array) {
						if (faceTexture.length === sides) {
							faceTexture = texture[j];
						} else {
							const v = ((this.world.simplex.noise4d(gx*3, gy*3, gz*3, j*3) + 1) * texture.length / 2) | 0;
							faceTexture = texture[v];
						}
					}
				}
				const {tx, ty} = TextureService.getTexturePosition(faceTexture);
				const obj = {
					ref: block,
					x: block.x,
					y: block.y,
					z: block.z,
					rotationId,
					lightness: SIDE_DISPLACEMENT[j].lightness,
					occlusionId: (skipAo || block.data.isRedstone) ? 0 : this._getOcclusionId(gx, gy, gz, j),
					textureX: tx,
					textureY: ty
				};
				if (block.data.isRedstone) {
					obj.y -= 14/32;
				} else if (block.data.isTorch && j !== 5) {
					if (j === 4) {
						obj[SIDE_DISPLACEMENT[j].originAxis] += SIDE_DISPLACEMENT[j].originValue * 2/16;
					} else {
						obj[SIDE_DISPLACEMENT[j].originAxis] += SIDE_DISPLACEMENT[j].originValue * 1/16;
					}
				} else {
					obj[SIDE_DISPLACEMENT[j].originAxis] += SIDE_DISPLACEMENT[j].originValue / 2;
				}

				faces.push(obj);
			}

		}
		return faces;
	}

	_buildMesh(skipAo = false) {
		if (this.blockList.length === 0) {
			return;
		}
		// console.log("Building chunk ", this.cx, this.cy, this.cz);
		if (this.mesh) {
			if (this.mesh.parent) {
				this.mesh.parent.remove(this.mesh);
				// this.mesh.geometry.dispose();
				this.mesh.remove();
				this.mesh = null;
			}
		}
		const material = this.graphics.getMaterial();
		const geometry = primitive;

		if (!material || !geometry) {
			return console.warn("Could not generate chunk mesh");
		}

		const instanced = new THREE.InstancedBufferGeometry();
		instanced.attributes.position = geometry.attributes.position;
		instanced.attributes.uv = geometry.attributes.uv;
		instanced.index = geometry.index;
		instanced.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 17);

		const faces = this.getFaces(skipAo);
		const faceCount = faces.length;

		const arrayPos = new Float32Array(faceCount * 3);
		const arrayVisual = new Float32Array(faceCount * 3);
		const arrayTile = new Float32Array(faceCount * 2);

		let i1 = 0, i2 = 0, i3 = 0;
		for(let i = faces.length-1; i >= 0; i--) {
			arrayPos[i1++] = faces[i].x;
			arrayPos[i1++] = faces[i].y;
			arrayPos[i1++] = faces[i].z;
			arrayVisual[i2++] = faces[i].rotationId;
			arrayVisual[i2++] = faces[i].lightness;
			arrayVisual[i2++] = faces[i].occlusionId;
			arrayTile[i3++] = faces[i].textureX;
			arrayTile[i3++] = faces[i].textureY;
		}

		const attributePos = new THREE.InstancedBufferAttribute(arrayPos, 3);
		instanced.setAttribute("instancePosition", attributePos);

		const attributeRotation = new THREE.InstancedBufferAttribute(arrayVisual, 3);
		instanced.setAttribute("instanceVisual", attributeRotation);

		const attributeTile = new THREE.InstancedBufferAttribute(arrayTile, 2);
		instanced.setAttribute("instanceTile", attributeTile);

		const mesh = new THREE.Mesh(instanced, material);
		mesh.position.set(this.cx * 16, this.cy * 16, this.cz * 16);

		this.instanced = instanced;
		this.mesh = mesh;
		return mesh;
	}

	requestMeshUpdate() {
		const parent = this.scene;
		if (!parent) {
			return null;
		}
		if (!this.willRebuildMesh) {
			this.willRebuildMesh = true;
			this.updateMeshTimer = setTimeout(this.rebuildMesh, 1);
			// this.rebuildMesh();
		}
	}

	rebuildMesh() {
		this.willRebuildMesh = false;
		const parent = this.scene;
		if (!parent) {
			return null;
		}
		const mesh = this._buildMesh();
		if (!mesh) {
			return;
		}
		parent.add(mesh);
		return mesh;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {number} id
	 */
	set(x, y, z, id) {
		let result = 0;
		if (id === 0) {
			this.clearBlock(x, y, z);
			result = 1;
		} else if (this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]) {
			if (!BlockData[id]) {
				throw new Error(`Block id ${id} does not exist on BlockData`);
			}
			this.replaceBlock(x, y, z, id);
			result = 0;
		} else {
			if (!BlockData[id]) {
				throw new Error(`Block id ${id} does not exist on BlockData`);
			}
			this.addBlock(x, y, z, id);
			result = 1;
		}
		this.requestMeshUpdate();
		return result;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	get(x, y, z) {
		return this.blocks[z] && this.blocks[z][x] ? this.blocks[z][x][y] : null;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	clearBlock(x, y, z) {
		const index = this.blockList.indexOf(this.blocks[z][x][y]);
		if (index === -1) {
			console.warn("Can't clear block because it wasn't found in the chunk block list");
			return;
		}

		this.blockList.splice(index, 1);
		this.blocks[z][x][y] = null;
	}

	replaceBlock(x, y, z, id) {
		if (this.blocks[z][x][y].data.faceCount !== BlockData[id].faceCount) {
			throw new Error("Cannot replace blocks with different face count: Routine unimplemented");
		}
		this.blocks[z][x][y].texture = BlockData[id].texture;
	}

	addBlock(x, y, z, id) {
		const texture = BlockData[id].texture;
		const blockObj = { id, data: BlockData[id], x, y, z, texture };
		if (!this.blocks[z]) {
			this.blocks[z] = [];
		}
		if (!this.blocks[z][x]) {
			this.blocks[z][x] = [];
		}
		this.blocks[z][x][y] = blockObj;
		this.blockList.push(blockObj);
	}
}