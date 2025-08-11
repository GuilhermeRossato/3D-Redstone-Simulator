import { loadEntity, removeEntity } from "../../lib/EntityStorage.js";
import { loadPlayer, playerCache, savePlayer } from "../../lib/PlayerStorage.js";
import { connectedPlayers, ServerRegion } from "../../lib/ServerRegion.js";

export default async function close(packet, ctx) {
  console.log("Received close packet:", packet, ctx);
  if (!ctx?.selfLoginCode && ctx?.player?.id) {
    ctx.selfLoginCode = ctx.player.id;
  }
  if (!ctx?.selfLoginCode) {
    return { type: "close", success: false, reason: "Player not found" };
  }
  if (ctx.entity && ctx.entity.id) {
    if (connectedPlayers[ctx.entity.id]) {
      console.log("Player will be removed from connected record");
      delete connectedPlayers[ctx.entity.id];
    } else {
      console.log("Player not found in connectedPlayers:", ctx.entity.id);
    }
  } else {
    console.warn("No entity found in context, cannot remove from connectedPlayers");
  }
  const selfLoginCode = ctx.selfLoginCode;
  const cached = playerCache[selfLoginCode] ? playerCache[selfLoginCode].findIndex((/** @type {any} */ c) => c === ctx) : -1;
  if (cached !== -1) {
    console.log("Player will be removed from player cache record at index", cached);
    playerCache[selfLoginCode].splice(cached, 1);
  } else {
    console.log("Player not found in cache record");
  }
  if (!ctx.region&&ctx.entity?.region) {
    const region = ServerRegion.from(ctx.entity.region);
    if (region.existsSync()) {
      ctx.region = region;
    }
  }
  if (ctx.region&&ctx.entity?.id) {
    console.log("Sending despawn event to region:", ctx.region.id);
    await ctx.region.add({
      type: "despawn",
      id: ctx.entity?.id,
      player: ctx.player?.id || selfLoginCode,
      pose: ctx.entity?.pose || ctx.player?.pose || [],
    });
  }
  const player = await loadPlayer(selfLoginCode);
  if (!player || !player.id) {
    return { type: "close", success: false, reason: "Player not found in database" };
  }
  if (player.entities?.length) {
    for (const entId of player.entities) {
      
      const ent = await loadEntity(entId);
      if (ent && ent.id) {
        console.log("Removing entity from storage:", ent.id);
        await removeEntity(ent.id);
      }
    }
    player.entities = [];
  }
  if (player.entity === ctx.entity?.id) {
    player.entity = "";
    player.region = "";
    player.pose = ctx.entity?.pose || [];
    player.despawned = Date.now();
    await savePlayer(player);
  }
  return {
    type: "close",
    success: true,
  };
}
