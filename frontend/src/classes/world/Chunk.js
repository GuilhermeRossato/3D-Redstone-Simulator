import * as THREE from '../../libs/three.module.js';
import BlockData from '../../data/BlockData.js';
import * as WorldHandler from '../../modules/WorldHandler.js';
import WorldBlock from '../../classes/world/WorldBlock.js';
import * as BlockHandler from '../../modules/BlockHandler.js';
import { getMaterial } from '../../modules/GraphicsHandler.js';
import SIDE_DISPLACEMENT from '../../data/SideDisplacement.js';
import TextureHandler from '../../modules/TextureHandler.js';

const primitive = new THREE.PlaneBufferGeometry(1, 1);
window['geometry'] = primitive;

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
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} cz
	 */
	constructor(cx, cy, cz) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;

		/** @type {Record<number, Record<number, Record<number, WorldBlock>>>} */
		this.blocks = [];
		/** @type {WorldBlock[]} */
		this.blockList = [];
		/** @type {any} */
		this.mesh = undefined;

		this.rebuildMesh = this.rebuildMesh.bind(this);
	}

	/**
	 * @param {THREE.Scene} scene
	 */
	assignTo(scene) {
		if (!scene) {
			throw new Error('Cannot assign chunk to falsy scene');
		}
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
		const isSolidBlock = WorldHandler.isSolidBlock;

		if (side === 0) {
			t = isSolidBlock(gx, gy+1, gz+1);
			r = isSolidBlock(gx+1, gy, gz+1);
			b = isSolidBlock(gx, gy-1, gz+1);
			l = isSolidBlock(gx-1, gy, gz+1);
			tr = isSolidBlock(gx+1, gy+1, gz+1);
			br = isSolidBlock(gx+1, gy-1, gz+1);
			bl = isSolidBlock(gx-1, gy-1, gz+1);
			tl = isSolidBlock(gx-1, gy+1, gz+1);
		} else if (side === 1) {
			t = isSolidBlock(gx, gy+1, gz-1);
			r = isSolidBlock(gx-1, gy, gz-1);
			b = isSolidBlock(gx, gy-1, gz-1);
			l = isSolidBlock(gx+1, gy, gz-1);
			tr = isSolidBlock(gx-1, gy+1, gz-1);
			br = isSolidBlock(gx-1, gy-1, gz-1);
			bl = isSolidBlock(gx+1, gy-1, gz-1);
			tl = isSolidBlock(gx+1, gy+1, gz-1);
		} else if (side === 2) {
			t = isSolidBlock(gx+1, gy+1, gz);
			r = isSolidBlock(gx+1, gy, gz-1);
			b = isSolidBlock(gx+1, gy-1, gz);
			l = isSolidBlock(gx+1, gy, gz+1);
			tr = isSolidBlock(gx+1, gy+1, gz-1);
			br = isSolidBlock(gx+1, gy-1, gz-1);
			bl = isSolidBlock(gx+1, gy-1, gz+1);
			tl = isSolidBlock(gx+1, gy+1, gz+1);
		} else if (side === 3) {
			t = isSolidBlock(gx-1, gy+1, gz);
			r = isSolidBlock(gx-1, gy, gz+1);
			b = isSolidBlock(gx-1, gy-1, gz);
			l = isSolidBlock(gx-1, gy, gz-1);
			tr = isSolidBlock(gx-1, gy+1, gz+1);
			br = isSolidBlock(gx-1, gy-1, gz+1);
			bl = isSolidBlock(gx-1, gy-1, gz-1);
			tl = isSolidBlock(gx-1, gy+1, gz-1);
		} else if (side === 4) {
			t = isSolidBlock(gx, gy+1, gz-1);
			r = isSolidBlock(gx+1, gy+1, gz);
			b = isSolidBlock(gx, gy+1, gz+1);
			l = isSolidBlock(gx-1, gy+1, gz);
			tr = isSolidBlock(gx+1, gy+1, gz-1);
			br = isSolidBlock(gx+1, gy+1, gz+1);
			bl = isSolidBlock(gx-1, gy+1, gz+1);
			tl = isSolidBlock(gx-1, gy+1, gz-1);
		} else if (side === 5) {
			t = isSolidBlock(gx, gy-1, gz+1);
			r = isSolidBlock(gx+1, gy-1, gz);
			b = isSolidBlock(gx, gy-1, gz-1);
			l = isSolidBlock(gx-1, gy-1, gz);
			tr = isSolidBlock(gx+1, gy-1, gz+1);
			br = isSolidBlock(gx+1, gy-1, gz-1);
			bl = isSolidBlock(gx-1, gy-1, gz-1);
			tl = isSolidBlock(gx-1, gy-1, gz+1);
		} else {
			return 0;
		}

		return tl + t * 2 + tr * 4 + (r + (br + (b + (bl + l * 2) * 2) * 2) * 2) * 8;
	}

	getFaces(useCached = false, skipAo = false, skipFaceOcclusion = false) {
		if (useCached && this._cachedFaces) {
			return this._cachedFaces;
		}
		/** @type {{ref: WorldBlock, x: number, y: number, z: number, rotationId: number, lightness: number, occlusionId: number, textureX: number, textureY: number, sideId: number}[]} */
		const faces = [];
		const get = WorldHandler.get;
		for(let i = this.blockList.length-1; i >= 0; i--) {
			const block = this.blockList[i];
			const gx = this.cx * 16 + block.x;
			const gy = this.cy * 16 + block.y;
			const gz = this.cz * 16 + block.z;

			const sides = typeof block.data.faceCount === "number" ? block.data.faceCount : 6;

			for (let j = 0; j < sides; j++) {
				// Face culling
				if (!skipFaceOcclusion) {
					if (block.data.isSolid !== false) {
						const inverseBlock = get(gx + SIDE_DISPLACEMENT[j].inverse[0], gy + SIDE_DISPLACEMENT[j].inverse[1], gz + SIDE_DISPLACEMENT[j].inverse[2]);
						if (inverseBlock && inverseBlock.data.isSolid !== false) {
							continue;
						}
					}
				}

				let faceTexture = BlockHandler.getTextureFromBlock(block, j, gx, gy, gz);
				let rotationId;
				if (block.data.isRedstone) {
					const rightBlock = get(gx + 1, gy, gz);
					const rightAboveBlock = (!rightBlock || !rightBlock.data.isRedstone) ? get(gx + 1, gy + 1, gz) : null;
					const rightBelowBlock = !rightBlock ? get(gx + 1, gy - 1, gz) : null;

					const leftBlock = get(gx - 1, gy, gz);
					const leftAboveBlock = (!leftBlock || !leftBlock.data.isRedstone) ? get(gx - 1, gy + 1, gz) : null;
					const leftBelowBlock = !leftBlock ? get(gx - 1, gy - 1, gz) : null;

					const upBlock = get(gx, gy, gz - 1);
					const upAboveBlock = (!upBlock || !upBlock.data.isRedstone) ? get(gx, gy + 1, gz - 1) : null;
					const upBelowBlock = !upBlock ? get(gx, gy - 1, gz - 1) : null;

					const downBlock = get(gx, gy, gz + 1);
					const downAboveBlock = (!downBlock || !downBlock.data.isRedstone) ? get(gx, gy + 1, gz + 1) : null;
					const downBelowBlock = !downBlock ? get(gx, gy - 1, gz + 1) : null;

					const aboveBlock = get(gx, gy + 1, gz);

					const rRed = (rightBlock && rightBlock.data.isRedstone) || (rightAboveBlock && rightAboveBlock.data.isRedstone && !aboveBlock) || (rightBelowBlock && rightBelowBlock.data.isRedstone);
					const lRed = (leftBlock && leftBlock.data.isRedstone) || (leftAboveBlock && leftAboveBlock.data.isRedstone && !aboveBlock) || (leftBelowBlock && leftBelowBlock.data.isRedstone);
					const uRed = (upBlock && upBlock.data.isRedstone) || (upAboveBlock && upAboveBlock.data.isRedstone && !aboveBlock) || (upBelowBlock && upBelowBlock.data.isRedstone);
					const dRed = (downBlock && downBlock.data.isRedstone) || (downAboveBlock && downAboveBlock.data.isRedstone && !aboveBlock) || (downBelowBlock && downBelowBlock.data.isRedstone);
					const lookupId = (rRed ? 8 : 0) + (lRed ? 4 : 0) + (uRed ? 2 : 0) + (dRed ? 1 : 0);
					if (!redstoneTextureLookup[lookupId]) {
						faceTexture = BlockHandler.FALLBACK_TEXTURE;
						rotationId = 446;
						console.warn("Unknown texture for " + lookupId + " at ", gx, gy, gz);
					} else {
						// @ts-ignore
						faceTexture = block.texture[redstoneTextureLookup[lookupId].id];
						rotationId = redstoneTextureLookup[lookupId].rot;
					}
				} else {
					rotationId = SIDE_DISPLACEMENT[j].rotationId;
				}
				const {tx, ty} = TextureHandler.getTexturePositionFromName(faceTexture);
				const obj = {
					ref: block,
					sideId: j,
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
					obj.y -= 7/16;
				} else if (block.data.isTorch && j !== 5) {
					obj.lightness = 1;
					obj[SIDE_DISPLACEMENT[j].originAxis] += SIDE_DISPLACEMENT[j].originValue * (j === 4 ? 2 : 1)/16;
				} else {
					obj[SIDE_DISPLACEMENT[j].originAxis] += SIDE_DISPLACEMENT[j].originValue / 2;
				}
				faces.push(obj);
			}
		}
		this._cachedFaces = faces;
		return faces;
	}

	/**
	 * @param {boolean} skipAo
	 */
	_buildMesh() {
		if (this.blockList.length === 0) {
			return null;
		}
		// console.log("Building chunk ", this.cx, this.cy, this.cz);
		if (this.mesh) {
			this.scene.remove(this.mesh);
			delete this.instanced.attributes.position;
			delete this.instanced.attributes.uv;
			this.instanced.index = null;
			
			this.instanced.dispose();
			this.mesh = null;
			this.instanced = null;
		}

		/** @type {THREE.MeshBasicMaterial} */
		const material = getMaterial();

		// const material = new THREE.MeshBasicMaterial();
		const geometry = primitive;

		if (!material || !geometry) {
			console.warn("Could not generate chunk mesh because material or geometry are missing");
			return null;
		}

		/** @type {any} */
		const instanced = new THREE.InstancedBufferGeometry();

		instanced.boundingSphere = new THREE.Sphere(
			new THREE.Vector3(0, 0, 0),
			28
		);

		instanced.attributes.position = geometry.attributes.position;
		instanced.attributes.uv = geometry.attributes.uv;
		instanced.index = geometry.index;

		const faces = this.getFaces(false, false, false);
		const faceCount = faces.length;

		instanced.setDrawRange(0, faceCount + 2);
		
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

		/** @type {any} */
		const mesh = new THREE.Mesh(instanced, material);
		mesh.name = `${this.cx}x${this.cy}x${this.cz}`;
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
			// debug instant rebuild mesh on request - this.rebuildMesh();
		}
		// debug auto update mesh - setTimeout(() => this.requestMeshUpdate(), 500);
	}

	rebuildMesh() {
		this.willRebuildMesh = false;
		if (this.updateMeshTimer) {
			this.updateMeshTimer = null;
		}
		const parent = this.scene;
		if (!parent) {
			return null;
		}
		const mesh = this._buildMesh();
		if (!mesh) {
			return;
		}
		// @ts-ignore
		parent.add(mesh);
		return mesh;
	}

	/**
	 * @param {number} x Relative block position
	 * @param {number} y
	 * @param {number} z
	 * @param {number} id
	 */
	set(x, y, z, id) {
		if (x < 0 || y < 0 || z < 0) {
			throw new Error(`Local chunk position for setting is outside (${x},${y},${z}) of the chunk buffer`);
		}
		if (x >= 16 || y >= 16 || z >= 16) {
			throw new Error(`Local chunk position for setting is outside (${x},${y},${z}) of the chunk buffer`);
		}
		let result = 0;
		if (id === 0) {
			this.clearBlock(x, y, z);
			result = 1;
		} else if (this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]) {
			if (!BlockData[id]) {
				throw new Error(`Block id ${id} does not exist on BlockData`);
			}
			this.replaceBlock(x, y, z, id);
			result = 1;
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
	 * @param {number} x Relative block position
	 * @param {number} y
	 * @param {number} z
	 */
	get(x, y, z) {
		return this.blocks[z] && this.blocks[z][x] ? this.blocks[z][x][y] : null;
	}

	/**
	 * @param {number} x Relative block position
	 * @param {number} y
	 * @param {number} z
	 */
	clearBlock(x, y, z) {
		if (!this.blocks[z] || !this.blocks[z][x] || !this.blocks[z][x][y]) {
			return;
		}
		const index = this.blockList.indexOf(this.blocks[z][x][y]);
		if (index === -1) {
			console.warn("Can't clear block because it wasn't found in the chunk block list, but is at the block tree");
			return;
		}

		this.blockList.splice(index, 1);
		this.blocks[z][x][y] = null;
	}

	/**
	 * @param {number} x Relative block position
	 * @param {number} y 
	 * @param {number} z 
	 * @param {number} id 
	 */
	replaceBlock(x, y, z, id) {
		this.blocks[z][x][y].id = id;
		this.blocks[z][x][y].data = BlockData[id];
		this.blocks[z][x][y].texture = BlockData[id].texture;
	}

	/**
	 * @param {number} x Relative block position
	 * @param {number} y 
	 * @param {number} z 
	 * @param {number} id 
	 */
	addBlock(x, y, z, id) {
		const blockObj = { id, data: BlockData[id], x, y, z };
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