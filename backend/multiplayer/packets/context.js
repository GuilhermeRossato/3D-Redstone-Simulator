
import { savePlayer } from "../../lib/PlayerStorage.js";
import { ServerChunk } from "../../lib/ServerChunk.js";
import { getChunkOffsets } from "../../scripts/chunkDistance.js";

export default async function context(payload, ctx) {
  if (!ctx.player) {
    throw new Error("Missing player context: Send setup first.");
  }
  if (!isNaN(payload.offset)) {
    ctx.offset = payload.offset;
  }
  const chunkPosList = await getChunkOffsets(10, 2);
  if (!chunkPosList.length) {
    throw new Error("Invalid chunk position list");
  }
  const absPosList = chunkPosList.map((a) => a.split(',').slice(0, 3).map((a,i)=>parseInt(a)*16+ctx.player.pose[i]));
  const chunkList = absPosList.map(a=>ServerChunk.fromAbsolute(a));
  if (!ctx.player.chunk || ctx.player.chunk !== chunkList[0].id) {
    console.log('Setting player chunk to', chunkList[0].id, 'from context packet');
    ctx.player.chunk = chunkList[0].id;
    await savePlayer(ctx.player);
  }
  const main = await chunkList[0].load();
  if (main.state.fileSize === 0) {
    console.log("Chunk file is empty at context position");
  }
  console.log("Context packet finished with", chunkList.length, "chunk positions");
  return {
    player: ctx.player,
    surrounding: chunkPosList,
    chunks: [{
      id: main.id,
      cx: main.cx,
      cy: main.cy,
      cz: main.cz,
      blocks: main.state.blocks,
      entities: main.state.entities,
    }]
  };
}
