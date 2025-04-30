import { ServerChunk } from "../../lib/ServerChunk.js";

const chunk_data_size_limit = 1024 * 256;

export async function sync(payload, context) {
  const { type, client, replyId } = payload;
  if (type !== "sync") {
    throw new Error("Invalid sync packet type");
  }
  if (!client || typeof client !== "number") {
    throw new Error("Missing or invalid client time");
  }
  if (!replyId) {
    throw new Error("Missing replyId");
  }
  if (!context?.player?.id) {
    throw new Error("Missing context player id");
  }
  if (payload.first) {
    context.syncPairs = [];
  }
  const server = Date.now();
  context.syncPairs.push([client, server]);
  const chunkList = [];
  let size = 0;
  if (payload.chunks) {
    for (
      let i = 0;
      i < payload.chunks.length &&
      chunkList.length < 16 &&
      size < chunk_data_size_limit;
      i++
    ) {
      const c = ServerChunk.from(payload.chunks[i]);
      if (
        !(
          c?.loaded &&
          c?.state &&
          typeof c?.state?.fileSize === "number" &&
          !isNaN(c.state.fileSize)
        )
      ) {
        await c.load(true);
      }
      if (
        c?.state &&
        typeof c?.state?.fileSize === "number" &&
        !isNaN(c.state.fileSize)
      ) {
        size += c.state.fileSize;
        chunkList.push(c);
        continue;
      }
    }
  }
  const chunks = chunkList.map((c) => ({
    cx: c.cx,
    cy: c.cy,
    cz: c.cz,
    blocks: c.state?.blocks,
    entities: c.state?.entities,
    inside: c.state?.inside,
  }));
  return {
    server,
    chunks,
    syncParis: payload?.last ? context.syncPairs : undefined,
  };
}
