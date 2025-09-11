import { loadEntity, removeEntity } from "../../lib/EntityStorage.js";
import { loadPlayer, playerCache, savePlayer } from "../../lib/PlayerStorage.js";
import { connectedPlayers as connectedPlayerEntities, ServerRegion } from "../../lib/ServerRegion.js";

export default async function close(packet, ctx) {
  const playerId = packet.playerId || ctx?.playerId || ctx?.player?.id;
  const entityId = packet.entityId || ctx?.entityId || ctx?.entity?.id;
  
  console.log("Received close packet:", {playerId, entityId}, packet, ctx);
  
  if (entityId && connectedPlayerEntities[entityId]) {
    console.log("Found connected player entity:", entityId, connectedPlayerEntities[entityId]);
    if (connectedPlayerEntities[entityId].pose instanceof Array && connectedPlayerEntities[entityId].pose.length > 3) {
      console.log("Connected player entity pose:", connectedPlayerEntities[entityId].pose);
      const region = ServerRegion.fromAbsolute(connectedPlayerEntities[entityId].pose);
      if (region && region.loaded && region.state?.entities) {
        ctx.region = region;
        console.log("Connected player entity region found and loaded:", region.id);
      } else {
        console.log("Connected player entity region is not loaded or not found for pose:", connectedPlayerEntities[entityId].pose);
      }
    } else {
      console.log("Connected player entity pose is not an array:", connectedPlayerEntities[entityId].pose);
    }
  }

  if (entityId) {
    if (connectedPlayerEntities[entityId]) {
      console.log("Player entity will be removed from connected record");
      delete connectedPlayerEntities[entityId];
    } else {
      console.log("Player not found in connectedPlayers:", entityId);
    }
  } else {
    console.warn("No entity found in context, cannot remove from connectedPlayers");
  }

  if (!ctx.region && ctx.pose) {
    const region = ServerRegion.fromAbsolute(ctx.pose);
    if (region.existsSync()) {
      ctx.region = region;
    }
  }
  if (ctx.region&&entityId) {
    if (!ctx.region?.state?.entities?.[entityId]) {
      console.warn('Warning: Closing player entity', entityId, 'is not present on region', ctx.region.id, 'before despawn');
    }
    console.log("Sending despawn event to region:", ctx.region.id);
    await ctx.region.add({
      type: "despawn",
      id: entityId,
      player: ctx?.playerId || playerId || playerId,
      pose: ctx?.pose || [],
    });
    if (ctx.region?.state?.entities?.[entityId]) {
      console.warn('Warning: Closing player entity', entityId, 'is still present on region', ctx.region.id, 'after despawn');
    }
  }
  
  if (!playerId) {
    return { type: "close", success: false, reason: "Player not found" };
  }
  
  const cached = playerCache[playerId] ? playerCache[playerId].findIndex((/** @type {any} */ c) => c === ctx) : -1;
  if (cached !== -1) {
    console.log("Player will be removed from player cache record at index", cached);
    playerCache[playerId].splice(cached, 1);
  } else {
    console.log("Player not found in cache record");
  }
  const player = await loadPlayer(playerId);
  if (!player || !player.id) {
    return { type: "close", success: false, reason: "Player not found in database" };
  }
  const match = (player.entities || []).find((e) => e && e.id === entityId);
  const entry = { id: entityId, region: ctx?.region?.id, pose: ctx.pose, health: ctx.health, maxHealth: ctx.maxHealth, spawned: 0, despawned: Date.now() };
  if (match) {
    Object.assign(match, entry);
  } else if (player.entities) {
    player.entities.unshift(entry);
  }
  if (player.entities.length > 5) {
    player.entities = player.entities.slice(0, 5);
  }
  delete player.entity;
  delete player.region;
  delete player.pose;
  delete player.spawned;
  player.despawned = Date.now();
  await savePlayer(player);
  return {
    type: "close",
    success: true,
  };
}
