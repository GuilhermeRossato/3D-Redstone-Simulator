import { position } from '../InputHandler.js';
import * as WorldHandler from '../../world/WorldHandler.js';

const chunkUpdateLookup = [];
for (let cx = -3; cx <= 3; cx++) {
    for (let cy = -3; cy <= 3; cy++) {
        for (let cz = -3; cz <= 3; cz++) {
            const dist = Math.abs(cx) + Math.abs(cy) + Math.abs(cz);
            chunkUpdateLookup.push({ cx, cy, cz, dist })
        }
    }
}
chunkUpdateLookup.sort((a, b) => a.dist - b.dist);

let chunkUpdateIndex = 0;

/** @typedef {{cx: number; cy: number; cz: number, lastModifiedAt: number, blocks: any[]}} ServerChunkData */
/** @typedef {{mesh: any; lastModifiedAt: number}} ClientChunkData */

const chunkFetchStatus = {
    inprogress: false,
}

/** @type {Record<string, ClientChunkData>} */
const chunkData = {};

/**
 * @param {number} cx 
 * @param {number} cy 
 * @param {number} cz 
 * @param {ServerChunkData} serverChunk 
 */
function processChunkLoad(cx, cy, cz, serverChunk) {
    const key = `${cx},${cy},${cz}`;
    const data = {
        mesh: null,
        lastModifiedAt: serverChunk.lastModifiedAt,
    };
    chunkData[key] = data;
    console.log('Loading chunk', cx, cy, cz);
    const chunk = WorldHandler.getChunk(cx, cy, cz, true);
    data.mesh = chunk.mesh;

}

export function updateExternalWorld() {
    // disabled for now
    return;
    if (chunkFetchStatus.inprogress) {
        return;
    }
    if (chunkUpdateIndex < chunkUpdateLookup.length) {
        const offset = chunkUpdateLookup[chunkUpdateIndex];
        const cx = offset.cx + Math.floor(position.x / 16);
        const cy = offset.cy + Math.floor(position.y / 16);
        const cz = offset.cz + Math.floor(position.z / 16);
        if (chunkData[`${cx},${cy},${cz}`]) {
            chunkUpdateIndex++;
        } else {
            chunkFetchStatus.inprogress = true;
            fetch(`/request-world-state/?cx=${cx}&cy=${cy}&cz=${cz}`).then(
                (response) => response.text()
            ).then(
                (raw) => {
                    if (!raw) {
                        throw new Error('Server did not send chunk data');
                    }
                    if (raw[0] !== '{') {
                        throw new Error('Server did not send valid JSON for chunk data: ' + raw);
                    }
                    setTimeout(() => {
                        chunkFetchStatus.inprogress = false;
                    }, 500);
                    const json = JSON.parse(raw);
                    if (typeof json !== 'object') {
                        throw new Error('Invalid server response to request world state');
                    }
                    chunkUpdateIndex++;
                    processChunkLoad(cx, cy, cz, json);
                }
            ).catch(async (err) => {
                console.log('Request world state failed');
                console.error(err);
                /*
                for (let i = 10; i >= 0; i--) {
                    console.log('Reloading page in ' + i + 'seconds');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                window.location.reload();
                */
            });
        }
    } else {
        chunkUpdateIndex = 0;
    }
}