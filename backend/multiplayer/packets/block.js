import { ServerChunk } from "../../lib/ServerChunk.js";

export default async function block(packet, ctx) {
  const chunk = ServerChunk.fromAbsolute(packet.x, packet.y, packet.z);
  if (!chunk.loaded) {
    console.log('Chunk not loaded on place, loading now: ', chunk.id);
    await chunk.load(true);
  }
  console.log("Processing block packet:", packet.type, "at", packet.x, packet.y, packet.z, "in chunk", chunk.id);
  await chunk.add({
    type: packet.type === 'place' || packet.type === 'block' ? "set" : "remove",
    x: packet.x,
    y: packet.y,
    z: packet.z,
    b: packet.b,
    id: packet.id
  });
}