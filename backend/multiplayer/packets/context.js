import { ServerChunk } from "../../lib/ServerChunk.js";
import { updatePlayer } from "../../PlayerStorage.js";
import { getChunksPosListWithin } from "../../utils/getChunksPosListWithin.js";

async function getSurroundingWorld(origin, target) {
  const ids = getChunksPosListWithin(origin, target);
  return await Promise.all(ids.map((id) => ServerChunk.from(id).load(true)));
}

export default async function context(payload, ctx) {
  if (!ctx.player) {
    throw new Error("Missing player context");
  }
  if (!isNaN(payload.offset)) {
    ctx.offset = payload.offset;
  }
  const chunkList = getChunksPosListWithin(
    ctx.player.pose.slice(0, 3).map((v) => Math.floor(v / 16)),
    2
  );
  const now = Date.now();
  ctx.player.watching = Object.fromEntries(chunkList.map(c=>[c.slice(0, 3).join(','), now]));
  ctx.player.chunk = chunkList[0];
  await updatePlayer(ctx.player);
  return {
    player: ctx.player,
  };
}
