import { savePlayer } from "../../lib/PlayerStorage.js";
import { ServerChunk } from "../../lib/ServerChunk.js";
import { getChunksPosListByDistance } from "../../utils/getChunksPosListWithin.js";

export default async function context(payload, ctx) {
  if (!ctx.player) {
    throw new Error("Missing player context");
  }
  if (!isNaN(payload.offset)) {
    ctx.offset = payload.offset;
  }
  const chunkPosList = getChunksPosListByDistance(
    ctx.player.pose.slice(0, 3).map((v) => Math.floor(v / 16)),
    16 * 3
  );
  if (!chunkPosList.length) {
    throw new Error("Invalid chunk position list");
  }
  const chunkList = chunkPosList.map((a) => ServerChunk.from(a));
  if (ctx.player.chunk !== chunkList[0]) {
    ctx.player.chunk = chunkList[0];
    await savePlayer(ctx.player);
  }
  const main = await chunkList[0].load();
  if (main.state.fileSize === 0) {
    console.log("Chunk file is empty at context position");
  }
  console.log("Context packet finished with", chunkList.length, "chunk positions");
  return {
    watching: chunkPosList,
    player: ctx.player,
  };
}
