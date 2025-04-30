import { ServerChunk } from "../../lib/ServerChunk.js";

export default async function world(payload, ctx) {
  const offset = payload.offset;
  const chunk = payload.chunk;
  const p = ctx.player.pose;
  let chunkObj;
  if (
    typeof offset === "object" &&
    !isNaN(offset[0]) &&
    !isNaN(offset[1]) &&
    !isNaN(offset[2])
  ) {
    chunkObj = ServerChunk.from(
      Math.floor(p[0] / 16) + offset[0],
      Math.floor(p[1] / 16) + offset[1],
      Math.floor(p[2] / 16) + offset[2]
    );
  } else if (
    typeof chunk === "object" &&
    !isNaN(chunk[0]) &&
    !isNaN(chunk[1]) &&
    !isNaN(chunk[2])
  ) {
    chunkObj = ServerChunk.from(chunk[0], chunk[1], chunk[2]);
  } else if (chunk) {
    chunkObj = ServerChunk.from(chunk);
  }
  if (chunkObj) {
    if (!chunkObj.loaded || chunkObj.getTimeSinceLoad() > 5_000) {
      await chunkObj.load(true);
      if (!chunkObj.loaded || chunkObj.getTimeSinceLoad() > 5_000) {
        throw new Error("Chunk not loaded");
      }
    }
    if (
      chunkObj?.state &&
      !chunkObj?.state?.inside?.find?.(
        (i) => i === ctx.player.id || i?.id === ctx.player.id
      )
    ) {
      await chunkObj.add(
        {
          type: "+",
          x: p[0],
          y: p[1],
          z: p[2],
          id: ctx.player.id,
          persist: false,
        },
        true
      );
    }
  }
  return chunkObj;
}
