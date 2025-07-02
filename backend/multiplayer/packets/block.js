import { ServerChunk } from "../../lib/ServerChunk.js";

export default async function block(packet, ctx) {
  const chunk = ServerChunk.fromAbsolute(packet?.pos?.[0] || packet.x, packet?.pos?.[1] || packet.y, packet?.pos?.[2] || packet.z);
  if (!chunk.loaded) {
    console.log('Chunk not loaded on place, loading now:', chunk.id);
    await chunk.load(true);
  }
  await chunk.add({type: packet.type === 'place' ? "set" : "remove", x: packet.pos[0] - chunk.cx * 16, y: packet.pos[1] - chunk.cy * 16, z: packet.pos[2] - chunk.cz * 16, block: packet.block, id: packet.id});
}