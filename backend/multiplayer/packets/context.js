
import { loadBlockMetadata } from "../../lib/blocks/BlockMetadataStorage.js";
import { blockNamingList, getBlockDefinitions, loadBlockNameData } from "../../lib/blocks/BlockSharedStorage.js";
import { ServerChunk } from "../../lib/ServerChunk.js";
import { ServerRegion } from "../../lib/ServerRegion.js";
import { getChunkOffsets } from "../../scripts/chunkDistance.js";
import { getProjectFolderPath } from "../../utils/getProjectFolderPath.js";
import { getPlayerContextPose, playerCache } from '../../lib/PlayerStorage.js';
import { sleep } from "../../utils/sleep.js";


/**
 * Initializes a context.
 * 
 * The "setup" is the first client packet and is responsible for setting up a player session.
 */

function getSurroundingOffsets() {
  return [
    [0, 0, 0], [-1, 0, 0],
    [0, -1, 0], [0, 0, -1],
    [0, 0, 1], [0, 1, 0],
    [1, 0, 0], [-1, -1, 0],
    [-1, 0, -1], [-1, 0, 1],
    [-1, 1, 0], [0, -1, -1],
    [0, -1, 1], [0, 1, -1],
    [0, 1, 1], [1, -1, 0],
    [1, 0, -1], [1, 0, 1],
    [1, 1, 0], [-1, -1, -1],
    [-1, -1, 1], [-1, 1, -1],
    [-1, 1, 1], [1, -1, -1],
    [1, -1, 1], [1, 1, -1],
    [1, 1, 1]
  ]
}

export default async function context(payload, ctx) {
  if (!ctx.player?.id) {
    throw new Error("Missing player context: Send setup first.");
  }
  const offsets = await getSurroundingOffsets();
  ctx.pose = getPlayerContextPose(payload, ctx);

  if (ctx.pose === null || ctx.pose === undefined || ctx.pose[0] === null || ctx.pose[0] === undefined) {
    throw new Error(`Invalid player pose: ${JSON.stringify(ctx.pose)}`);
  }

  const regionsPos = offsets.map((offs) => offs.map((off, j) => off * 64 + ctx.pose[j]));
  const chunksPos = offsets.map((offs) => offs.map((off, j) => off * 16 + ctx.pose[j]));

  const regions = regionsPos.map((pos) => ServerRegion.fromAbsolute(pos));
  const chunks = chunksPos.map((pos) => ServerChunk.fromAbsolute(pos));

  await sleep(50);

  for (let i = regions.length - 1; i > 0; i--) {
    if (!regions[i].existsSync()) {
      regions.splice(i, 1);
    }
  }
  for (let i = chunks.length - 1; i > 0; i--) {
    if (!chunks[i].existsSync()) {
      chunks.splice(i, 1);
    }
  }

  if (chunks.length) {
    await chunks[0].load();
  }

  if (regions.length) {
    await regions[0].load();
    if (playerCache.size === 0 && Object.keys(regions[0].state?.entities || {}).length) {
      console.warn('Empty player cache but player cache from first region:', regions[0].id);
      for (const e of regions[0].state.entities) {
        console.log('Entity in region:', e);
      }
    }
  }

  if (payload.blockTypeTimes) {
    ctx.blockTypeTimes = payload.blockTypeTimes;
  }

  const blocks = await getBlockDefinitions();

  for (const id in blocks) {
    if (ctx.blockTypeTimes && ctx.blockTypeTimes[id] && blocks[id].data && blocks[id].data.changed && blocks[id].data.changed <= ctx.blockTypeTimes[id]) {
      console.log('Removing unchanged block type from context:', id, blocks[id].data.key);
      delete blocks[id];
    }
  }

  return {
    player: ctx.player,
    regions: regions.map((r, i) => ({
      id: r.id,
    })),
    chunks: chunks.map((c, i) => ({
      id: c.id,
    })),
    blocks,
  };
}
