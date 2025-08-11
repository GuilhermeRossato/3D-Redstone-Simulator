import { ServerChunk } from "../../lib/ServerChunk.js";

export default async function block(packet, ctx) {
  const chunk = ServerChunk.fromAbsolute(packet.x, packet.y, packet.z);
  if (!chunk.loaded) {
    console.log('Chunk not loaded on place, loading now:', chunk.id);
    await chunk.load(true);
  }
  await chunk.add({type: packet.type === 'place' ? "set" : "remove", x: packet.x - chunk.cx * 16, y: packet.y - chunk.cy * 16, z: packet.z - chunk.cz * 16, block: packet.block, id: packet.id});
}