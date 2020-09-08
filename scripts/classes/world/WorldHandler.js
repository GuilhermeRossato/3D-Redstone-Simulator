'use strict';

import TextureService from '../../graphics/TextureService.js';
import BlockData from '../../data/BlockData.js';
import Chunk from '../world/Chunk.js';

export default class WorldHandler {
	constructor(graphicsEngine) {
		this.graphics = graphicsEngine;
		this.scene = graphicsEngine.scene;
		/** @type {Record<number, Record<number, Record<number, Chunk>>>} */
		this.chunks = [];
	}

	async load() {
		if (!TextureService.loaded) {
			await TextureService.load();
		}
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	isSolidBlock(x, y, z) {
		return !!(this.get(x, y, z));
	}

	/**
	 * Get a chunk by its world position
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	getChunkAtWorldPosition(x, y, z) {
		return this.getChunk(
			this.worldPositionToChunk(x),
			this.worldPositionToChunk(y),
			this.worldPositionToChunk(z),
			false
		);
	}

	/**
	 * Get a chunk by its chunk position
	 * @param {number} cz
	 * @param {number} cy
	 * @param {number} cz
	 * @param {boolean} [createOnMissing]
	 */
	getChunk(cx, cy, cz, createOnMissing = true) {
		if (!this.chunks[cz]) {
			this.chunks[cz] = [];
		}
		if (!this.chunks[cz][cx]) {
			this.chunks[cz][cx] = [];
		}
		if (createOnMissing && !this.chunks[cz][cx][cy]) {
			this.chunks[cz][cx][cy] = new Chunk(this.graphics, this, cx, cy, cz);
			this.chunks[cz][cx][cy].assignTo(this.scene);
		}
		return this.chunks[cz][cx][cy];
	}

	/**
	 * Converts a world position dimension into its chunk position equivalent
	 * @param {number} v
	 */
	worldPositionToChunk(v) {
		return v >= 0 ? Math.floor( v / 16 ) : Math.floor( - v / 16 - 1 );
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	get(x, y, z) {
		const cx = this.worldPositionToChunk(x);
		const cy = this.worldPositionToChunk(y);
		const cz = this.worldPositionToChunk(z);
		const chunk = this.getChunk(cx, cy, cz, false);
		if (!chunk) {
			return null;
		}
		const rx = (x|0) - cx * 16;
		const ry = (y|0) - cy * 16;
		const rz = (z|0) - cz * 16;
		return chunk.get(rx, ry, rz);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {number} id
	 */
	set(x, y, z, id) {
		const cx = this.worldPositionToChunk(x);
		const cy = this.worldPositionToChunk(y);
		const cz = this.worldPositionToChunk(z);
		const chunk = this.getChunk(cx, cy, cz, id !== 0);
		if (!chunk) {
			return; // id is zero or chunk could not be created
		}
		const rx = (x|0) - cx * 16;
		const ry = (y|0) - cy * 16;
		const rz = (z|0) - cz * 16;

		const result = chunk.set(rx, ry, rz, id);

		if (result === 1) {
			// Update neighboor chunks (chunks of touching blocks)
			// only needed if AO is enabled or if this block id interacts with others

			let neighboorChunk;
			let step;
			if (rx == 0 || rx == 15) {
				neighboorChunk = this.getChunk(cx + (rx == 0 ? -1 : 1), cy, cz);
				if (neighboorChunk) {
					neighboorChunk._rebuildMesh();
				}
			}
			if (ry == 0 || ry == 15) {
				neighboorChunk = this.getChunk(cx, cy + (ry == 0 ? -1 : 1), cz);
				if (neighboorChunk) {
					neighboorChunk._rebuildMesh();
				}
			}
			if (rz == 0 || rz == 15) {
				neighboorChunk = this.getChunk(cx, cy, cz + (rz == 0 ? -1 : 1));
				if (neighboorChunk) {
					neighboorChunk._rebuildMesh();
				}
			}
			//console.log("Checking relatives of ", x, y, z, " that are ", rx, ry, rz);
			// Check diagonal chunks
			if (rx == ry && (rx == 0 || rx == 15)) {
				step = rx == 0 ? -1 : 1;
				neighboorChunk = this.getChunk(cx + step, cy + step, cz);
				if (neighboorChunk) {
					neighboorChunk._rebuildMesh();
				}
			}
			if (ry == rz && (ry == 0 || ry == 15)) {
				step = ry == 0 ? -1 : 1;
				neighboorChunk = this.getChunk(cx, cy + step, cz + step);
				if (neighboorChunk) {
					neighboorChunk._rebuildMesh();
				}
			}
			if (rx == rz && (rz == 0 || rz == 15)) {
				step = rz == 0 ? -1 : 1;
				neighboorChunk = this.getChunk(cx + step, cy, cz + step);
				if (neighboorChunk) {
					neighboorChunk._rebuildMesh();
				}
			}
			// Super corners neighboor chunks
			if ((rx == 0 || rx == 15) && (ry == 0 || ry == 15) && (rz == 0 || rz == 15)) {
				neighboorChunk = this.getChunk(cx + (rx == 0 ? -1 : 1), cy + (ry == 0 ? -1 : 1), cz + (rx == 0 ? -1 : 1));
				if (neighboorChunk) {
					neighboorChunk._rebuildMesh();
				}
			}
		}

		return result;
	}
}