import { ServerChunk } from "../../lib/ServerChunk.js";

export default async function place(packet, ctx) {
  const chunk = ServerChunk.fromAbsolute(packet.pos[0], packet.pos[1], packet.pos[2]);
  if (!chunk.loaded) {
    console.log('Chunk not loaded on place, loading now:', chunk.id);
    await chunk.load(true);
  }
  await chunk.add({type: 'set', x: packet.pos[0] - chunk.cx * 16, y: packet.pos[1] - chunk.cy * 16, z: packet.pos[2] - chunk.cz * 16, block: packet.block, id: packet.id});
}