import { ServerChunk } from "../../lib/ServerChunk.js";
import { ServerRegion } from "../../lib/ServerRegion.js";

const chunk_data_size_limit = 1024 * 256;

export async function sync(payload, ctx) {
  const { type, client } = payload;
  if (type !== "sync") {
    throw new Error("Invalid sync packet type");
  }
  if (!client || typeof client !== "number") {
    throw new Error("Missing or invalid client time");
  }
  if (!payload.replyId) {
    throw new Error("Missing replyId");
  }
  if (!ctx?.player?.id) {
    throw new Error("Missing context player id");
  }
  if (!ctx.syncPairs) {
    ctx.syncPairs = [];
  }
  const server = Date.now();
  ctx.syncPairs.push([client, server]);
  const subs = payload.subjects || [];
  const results = [];
  for (const id of subs) {
    if (!id) continue;
    if (id.startsWith('b')||id.startsWith('c')) {
      const chunk = ServerChunk.from(id);
      if (!chunk) {
        throw new Error(`Invalid chunk identifier: ${id}`);
      }
      if (!chunk.loaded){
        await chunk.load();
      }
      results.push({...chunk.state, id: chunk.id});
      continue;
    }
    if (id.startsWith('r')) {
      const region = ServerRegion.from(id);
      if (!region) {
        throw new Error(`Invalid region identifier: ${id}`);
      }
      if (!region.loaded) {
        await region.load();
      }
      results.push(region.state);
      continue;
    }
    console.warn(`Unknown subject identifier: ${id}`);
  }
  return {
    server,
    syncPairs: payload?.last ? ctx.syncPairs : undefined,
    results,
  };
}
