// @ts-check

import WorldHandler from '../scripts/classes/World/WorldHandler.js';

const mockGraphics = {
    scene: {
        add: () => {}
    }
};

const world = new WorldHandler(mockGraphics);

if (world.chunks.length !== 0) {
    throw new Error("Unexpected chunk count: " + world.chunks.length);
}

world.getChunk(0, 0, 0, true);

if (world.chunks.length !== 1) {
    throw new Error("Unexpected chunk count: " + world.chunks.length);
}
if (world.chunks["-1"]) {
    console.log(world.chunks);
    throw new Error("Chunk creted incorrectly at chunk z = -1");
}
if (!world.chunks[0]) {
    throw new Error("WorldHandled did not create chunk at z = 0 when requested");
}
if (!world.chunks[0][0]) {
    throw new Error("WorldHandled did not create chunk at z = 0 and x = 0 when requested");
}
if (!world.chunks[0][0][0]) {
    throw new Error("WorldHandled did not create chunk at z = 0, x = 0 and y = 0 when requested");
}
world.getChunk(-1, 0, 0, true);

if (world.chunks.length !== 1) {
    console.log(world.chunks);
    throw new Error("WorldHandled did not create chunk at expected place");
}
if (world.chunks[0].length !== 1) {
    console.log(world.chunks[0]);
    throw new Error("WorldHandled did not create chunk at expected place");
}
if (!world.chunks[0][0][-1]) {
    console.log(world.chunks[0][0]);
    throw new Error("WorldHandled did not create chunk at expected place");
}
