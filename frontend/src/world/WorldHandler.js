import Chunk from '../classes/world/Chunk.js';
import { scene } from '../modules/GraphicsHandler.js';
import { loadWorld } from './loadWorld.js';

let isSavingTheWorldLocally = false;
/** @type {Record<number, Record<number, Record<number, Chunk>>>} */
const chunks = [];

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
    if (isSavingTheWorldLocally) {
        updateLocalWorldData(x, y, z, id);
    }
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

export async function load() {
  return await loadWorld();
}

const startingLocalWorldBlockData = [
    [0, 0, 0, 1],
    [1, 0, 0, 2],
    [0, 0, 1, 3],
    [1, 0, 1, 4]
]

async function updateLocalWorldData(x, y, z, id) {
    let blockData = startingLocalWorldBlockData;
    try {
        const blockDataStr = localStorage.getItem('world-data');
        if (blockDataStr) {
            blockData = JSON.parse(blockDataStr);
        }
    } catch (err) {
        console.error(err);
    }
    const block = blockData.find(([bx, by, bz]) => bx === x && by === y && bz === z);
    if (block) {
        block[3] = id;
    } else {
        blockData.push([x, y, z, id]);
    }
    localStorage.setItem('world-data', JSON.stringify(blockData));
}

export async function startLocalWorld() {
    isSavingTheWorldLocally = true;
    let blockData = startingLocalWorldBlockData;
    try {
        const blockDataStr = localStorage.getItem('world-data');
        if (blockDataStr) {
            blockData = JSON.parse(blockDataStr);
        }
    } catch (err) {
        console.error(err);
    }
    if (!(blockData instanceof Array)) {
        blockData = startingLocalWorldBlockData;
    }
    for (const [x, y, z, id] of blockData) {
        set(x, y, z, id);
    }
}

export function resetLocalWorld() {
    localStorage.removeItem('world-data');
    window.location.reload();
}

// for debug
window['WorldHandler'] = {
    isSolidBlock,
    getChunkAtWorldPosition,
    getChunk,
    worldPositionToChunk,
    get,
    set,
    load,
}
