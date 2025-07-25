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
  const selfLoginCode = ctx.selfLoginCode;
  if (playerCache[selfLoginCode]) {
    console.log("Player will be removed from selfLoginCode:", selfLoginCode);
    delete playerCache[selfLoginCode];
  } else {
    console.log("Player not found in selfLoginCode:", selfLoginCode);
  }
  if (connectedPlayers[selfLoginCode]) {
    console.log("Player will be removed from connectedPlayers:", selfLoginCode);
    delete connectedPlayers[ctx.pid];
  } else {
    console.log("Player not found in connectedPlayers:", selfLoginCode);
  }
  const playerId = ctx?.entity?.player || ctx?.player?.id;
  if (ctx?.entity?.id && playerId && (ctx?.entity?.pose || (typeof ctx?.entity?.health === 'number' && !isNaN(ctx?.entity?.health)) || (typeof ctx?.entity?.maxHealth === 'number' && !isNaN(ctx?.entity?.maxHealth)))) {
    const player = await loadPlayer(playerId);
    if (!player) {
      console.error("Player not found in storage:", playerId);
      return { type: "close", success: false, reason: "Player not found", id: playerId };
    }
    if (player.id !== playerId) {
      console.error("Player ID mismatch:", player.id, "!==", playerId);
      return { type: "close", success: false, reason: "Player ID mismatch", id: playerId };
    }
    if (playerCache[player.id]) {
      console.log("Player found in cache, deleting player cache:", player.id);
      delete playerCache[player.id];
    }
    const event = {
      type: "despawn",
      entity: ctx?.entity?.id ? ctx.entity.id : player.entity,
      player: player.id,
      pose: player.pose,
    };
    if (player && typeof ctx?.entity?.health === 'number' && !isNaN(ctx?.entity?.health)) {
      player.health = ctx.entity.health;
    }
    if (player && ctx?.entity?.maxHealth && typeof ctx?.entity?.maxHealth === 'number' && !isNaN(ctx?.entity?.maxHealth)) {
      player.maxHealth = ctx.entity.maxHealth;
    }
    if (player && ctx.entity.pose && !ctx.entity.pose.some(a => typeof (a) !== 'number' || isNaN(a))) {
      player.pose = ctx.entity.pose.map((a, i) => parseFloat(a.toFixed(i < 3 ? 2 : 5)));
    }
    if (player && ctx.entity.name) {
      player.name = ctx.entity.name;
    }
    player.despawned = Date.now();
    console.log('Saving player data before closing:', player);
    delete player.chunk;
    delete player.region;
    delete player.entity;
    await savePlayer(player);
    let region = ctx.region;
    if (typeof region === 'string') {
      try {
        region = ServerRegion.from(region);
      } catch (e) {
        console.error("Error converting region from string:", e);
        region = null;
      }
    }
    if (!region) {
      try {
        region = ServerRegion.fromAbsolute(event.pose);
      } catch (e) {
        console.error("Error converting region from pose:", e);
        region = null;
      }
    }
    if (!region && ctx?.pose) {
      region = ServerRegion.fromAbsolute(ctx.pose);
      console.log("No region found, created region from pose:", ctx.pose);
    }
    if (region instanceof ServerRegion && region.id && region.state?.id) {
      const evt = await region.add(event);
      if (region.state?.players?.[player.id]) {
        console.log("Warning: Player still present on region", region.id, "after despawn event");
      }
      if (region.state?.entities?.find(p => p.id === evt.entity||p.id === 'e'+evt.entity||'e'+p.id === evt.entity)) {
        console.log("Warning: Entity still present on region", region.id, "after despawn event");
      }
    }
  }
  return {
    type: "close",
    success: true,
  };
}
