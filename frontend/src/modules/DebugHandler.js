import { get, set } from "./WorldHandler.js";

/**
 * @typedef {Object} ChunkObject
 * @property {any} _id
 * @property {string} key
 * @property {string} createdAt
 * @property {{[y: string]: {[x: string]: {[z: string]: {id: number, date: string, actor: string}[]}}}} blocks
 */


/**
 * @param {number} cx 
 * @param {number} cy 
 * @param {number} cz 
 * @param {number} range
 */
export async function reliveWorld(cx, cy, cz, range = 2) {
    const blockEventList = await getHistoryAroundPosition(cx, cy, cz, range);
    console.log('There are', blockEventList.length, 'block history lists');
    // Create event list
    const events = [];
    for (const block of blockEventList) {
        for (const history of block.history) {
            events.push({
                date: history.date,
                id: history.id,
                actor: history.actor,
                x: block.x,
                y: block.y,
                z: block.z,
            });
        }
    }
    events.sort((a, b) => a.date > b.date ? 1 : (a.date < b.date ? -1 : 0));
    console.log(events);
    if (events.length <= 0) {
        console.log('There are no events and relive world cannot continue');
        return;
    }
    // Hide the world
    for (const block of blockEventList) {
        set(block.x, block.y, block.z, 0);
    }
    // Recreate the world
    for (const {x, y, z, id} of events) {
        const current = get(x, y, z);
        if (id === 0 && current === null) {
            console.log('Skipped same event at', x, y, z);
            continue;
        }
        if (id !== 0 && current && current.id === id) {
            console.log('Skipped same event at', x, y, z);
            continue;
        }
        set(x, y, z, id);
        await new Promise(resolve => setTimeout(resolve, 30));
    }
}

/**
 * @param {number} cx 
 * @param {number} cy 
 * @param {number} cz 
 */
async function getWorldChunkAt(cx, cy, cz) {
    const response = await fetch(`/get-chunk-at/?x=${cx}&y=${cy}&z=${cz}`);
    const data = await response.text();
    return JSON.parse(data);
}

/**
 * @param {number} cx 
 * @param {number} cy 
 * @param {number} cz 
 * @param {number} range
 * @returns {Promise<{x: number, y: number, z: number, history: {id: number, date: string, actor: string}[]}[]>}
 */
async function getHistoryAroundPosition(cx, cy, cz, range = 2) {
    if (typeof cx !== 'number' || typeof cy !== 'number' || typeof cz !== 'number' || isNaN(cx) || isNaN(cy) || isNaN(cz)) {
        return null;
    }
    /** @type {{ox: number; oy: number; oz: number; chunk: ChunkObject}[]} */
    const chunkList = [];
    for (let x = cx - range; x <= cx + range; x++) {
        for (let y = cy - range; y <= cy + range; y++) {
            for (let z = cz - range; z <= cz + range; z++) {
                const chunk = await getWorldChunkAt(x, y, z);
                if (!chunk) {
                    continue;
                }
                chunkList.push({
                    ox: x * 16,
                    oy: y * 16,
                    oz: z * 16,
                    chunk,
                });
            }
        }
    }

    const blockEventList = [];
    for (const {ox, oy, oz, chunk} of chunkList) {
        for (const y in chunk.blocks) {
            for (const x in chunk.blocks[y]) {
                for (const z in chunk.blocks[y][x]) {
                    const ix = parseInt(x, 10);
                    const iy = parseInt(y, 10);
                    const iz = parseInt(z, 10);
                    blockEventList.push({
                        x: ox + ix,
                        y: oy + iy,
                        z: oz + iz,
                        history: chunk.blocks[y][x][z],
                    });
                }
            }
        }
    }

    return blockEventList;
}