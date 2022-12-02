'use strict';

import Chunk from '../classes/world/Chunk.js';
import * as THREE from '../libs/three.module.js';

/** @type {Record<number, Record<number, Record<number, Chunk>>>} */
const chunks = [];

/** @type {THREE.Scene} */
let scene;

export function isSolidBlock(x, y, z) {
    const worldBlock = get(x, y, z);
    if (!worldBlock) {
        return false;
    }
    return (worldBlock && worldBlock.data.isSolid !== false);
}

/**
 * Get a chunk by its world position
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function getChunkAtWorldPosition(x, y, z) {
    return getChunk(
        worldPositionToChunk(x),
        worldPositionToChunk(y),
        worldPositionToChunk(z),
        false
    );
}

/**
 * Get a chunk by its chunk position
 * @param {number} cx
 * @param {number} cy
 * @param {number} cz
 * @param {boolean} [createOnMissing]
 */
export function getChunk(cx, cy, cz, createOnMissing = true) {
    if (!chunks[cz]) {
        chunks[cz] = [];
    }
    if (!chunks[cz][cx]) {
        chunks[cz][cx] = [];
    }
    let chunk = chunks[cz][cx][cy];
    if (!chunk && createOnMissing) {
        chunk = new Chunk(cx, cy, cz);
        chunk.assignTo(scene);
        chunks[cz][cx][cy] = chunk;
    }
    return chunk;
}

/**
 * Converts a world position dimension into its chunk position equivalent
 * @param {number} v
 */
export function worldPositionToChunk(v) {
    return Math.floor(v / 16);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function get(x, y, z) {
    const cx = worldPositionToChunk(x);
    const cy = worldPositionToChunk(y);
    const cz = worldPositionToChunk(z);
    const chunk = getChunk(cx, cy, cz, false);
    if (!chunk) {
        return null;
    }
    const rx = x - cx * 16;
    const ry = y - cy * 16;
    const rz = z - cz * 16;
    return chunk.get(rx, ry, rz);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} id
 */
export function set(x, y, z, id) {
    const cx = worldPositionToChunk(x);
    const cy = worldPositionToChunk(y);
    const cz = worldPositionToChunk(z);
    const createOnMissing = id !== 0;
    const chunk = getChunk(cx, cy, cz, createOnMissing);
    if (!chunk) {
        return; // id is zero or chunk could not be created
    }
    const rx = x - (cx) * 16;
    const ry = y - (cy) * 16;
    const rz = z - (cz) * 16;

    const result = chunk.set(rx, ry, rz, id);

    if (result === 1) {
        // Update neighboor chunks (chunks of touching blocks)
        // only needed if AO is enabled or if block id interacts with others

        let neighboorChunk;
        let step;
        if (rx == 0 || rx == 15) {
            neighboorChunk = getChunk(cx + (rx == 0 ? -1 : 1), cy, cz, false);
            if (neighboorChunk) {
                neighboorChunk.requestMeshUpdate();
            }
        }
        if (ry == 0 || ry == 15) {
            neighboorChunk = getChunk(cx, cy + (ry == 0 ? -1 : 1), cz, false);
            if (neighboorChunk) {
                neighboorChunk.requestMeshUpdate();
            }
        }
        if (rz == 0 || rz == 15) {
            neighboorChunk = getChunk(cx, cy, cz + (rz == 0 ? -1 : 1), false);
            if (neighboorChunk) {
                neighboorChunk.requestMeshUpdate();
            }
        }
        // Checking diagonal chunks
        if (rx == ry && (rx == 0 || rx == 15)) {
            step = rx == 0 ? -1 : 1;
            neighboorChunk = getChunk(cx + step, cy + step, cz, false);
            if (neighboorChunk) {
                neighboorChunk.requestMeshUpdate();
            }
        }
        if (ry == rz && (ry == 0 || ry == 15)) {
            step = ry == 0 ? -1 : 1;
            neighboorChunk = getChunk(cx, cy + step, cz + step, false);
            if (neighboorChunk) {
                neighboorChunk.requestMeshUpdate();
            }
        }
        if (rx == rz && (rz == 0 || rz == 15)) {
            step = rz == 0 ? -1 : 1;
            neighboorChunk = getChunk(cx + step, cy, cz + step, false);
            if (neighboorChunk) {
                neighboorChunk.requestMeshUpdate();
            }
        }
        // Super corners neighboor chunks
        if ((rx == 0 || rx == 15) && (ry == 0 || ry == 15) && (rz == 0 || rz == 15)) {
            neighboorChunk = getChunk(cx + (rx == 0 ? -1 : 1), cy + (ry == 0 ? -1 : 1), cz + (rx == 0 ? -1 : 1), false);
            if (neighboorChunk) {
                neighboorChunk.requestMeshUpdate();
            }
        }
    }

    return result;
}

async function load(loadedScene) {
    scene = loadedScene;
    set(-1, -2, -1, 1);
    set(-1, 2, -1, 1);
    set(-1, 0, -1, 1);
    set(0, 0, -1, 1);
    set(-1, -1, -1, 1);
    set(-1, 3, -1, 1);
    set(-1, 1, -1, 1);
    set(0, 1, -1, 1);
    set(-1, 0, 0, 2);
    set(0, 0, 0, 2);
    set(1, 0, 0, 2);
    set(0, 0, 1, 2);
    set(1, 0, 1, 2);
    set(-1, 0, 1, 2);
    set(2, 0, 0, 2);
    set(2, 0, 1, 2);
    set(2, 1, 1, 2);
    set(1, 0, -1, 3);
    set(1, 0, -2, 3);
    set(1, 1, -1, 3);
    set(1, 1, -2, 3);
    set(2, 0, -1, 3);
    set(2, 0, -2, 3);
}

// Debug
window['WorldHandler'] = {
    isSolidBlock,
    getChunkAtWorldPosition,
    getChunk,
    worldPositionToChunk,
    get,
    set,
    load,
}

export default {
    isSolidBlock,
    getChunkAtWorldPosition,
    getChunk,
    worldPositionToChunk,
    get,
    set,
    load,
}