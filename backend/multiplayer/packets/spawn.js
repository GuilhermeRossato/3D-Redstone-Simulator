import { ServerEntityEventHandler } from "../../lib/entities/ServerEntityHandler.js";
import { createServerEntity, loadServerEntity, removeEntity } from "../../lib/EntityStorage.js";
import { GameEventEmitter } from "../../lib/GameEventEmitter.js";
import { loadPlayer, savePlayer } from "../../lib/PlayerStorage.js";
import { ServerChunk } from "../../lib/ServerChunk.js";
import { connectedPlayers, ServerRegion } from "../../lib/ServerRegion.js";

export default async function spawn(payload, ctx) {
  if (!ctx.player || typeof ctx.player !== "object") {
    throw new Error("Invalid context object: Player is not initialized");
  }
  if (ctx.player.entity) {
    console.log(
      "Received spawn entity event but entity already exists:",
      ctx.player.entity
    );
  }
  if (!ctx.send) {
    throw new Error("Context does not have a send function");
  }
  if (payload.type !== "spawn") {
    throw new Error("Invalid spawn packet type");
  }
  if (!payload||isNaN(payload.offset)) {
    throw new Error("Invalid spawn packet offset");
  }
  ctx.offset = payload.offset || 0;
  ctx.player = await loadPlayer(ctx.player.id);
  const health = ctx.player.health;
  const life = ctx.player.maxHealth;
  if (!ctx.entity || !ctx.entity.id) {
    ctx.entity = {
      id: ctx.entity?.id || ctx.player?.entity || Math.random().toString(36).substring(2, 8),
      player: ctx.player.id,
      name: ctx.player.name,
      spawned: ctx.player.spawned || new Date().getTime(),
      pose: [...ctx.player.pose],
      health: typeof health !== "number" || isNaN(health) ? 20 : health,
      maxHealth: typeof life !== "number" || isNaN(life) ? 20 : life,
    }
  }
  if (!ctx.entity.id.startsWith('e')) {
    ctx.entity.id = `e${ctx.entity.id}`; // Ensure entity ID starts with 'e'
  }
  const region = ServerRegion.fromAbsolute(ctx.entity.pose);
  ctx.region = region;
  ctx.chunk = ServerChunk.fromAbsolute(ctx.entity.pose);
  ctx.entity
  ctx.player.region = region.id;
  const name = ctx.player.name || ctx.entity.name;
  const event = {
    type: "spawn",
    entity: ctx.entity,
    player: ctx.player.id,
    name,
    health: ctx.entity.health,
    maxHealth: ctx.entity.maxHealth,
    pose: ctx.entity.pose,
  };
  if (region.state.players[ctx.player.id]) {
    console.log("Warning: Player connected on region", region.id, "before spawn event");
  }
  const evt = await region.add(event);
  if (region.state.players[ctx.player.id] !== ctx.entity.id) {
    console.log("Warning: Player not connected on region", region.id, "after spawn event");
  }

  ctx.player.spawned = evt.time;
  ctx.player.entity = ctx.entity.id;
  await savePlayer(ctx.player);
  const nearbyPlayers = new Set();
  await Promise.all(ServerRegion.getSurroundingRegions(ctx.entity.pose, 64, true).map(async (region) => {
    const players = await region.getPlayerIds();
    players.forEach((id) => id !== ctx.player.id && connectedPlayers[id] && nearbyPlayers.add(id));
  }));
  if (connectedPlayers[ctx.player.id]) {
    console.log("Warning: Player already connected on spawn", ctx.player.id);
  }
  connectedPlayers[ctx.player.id] = ctx;
  const playerEntities = Array.from(nearbyPlayers).map(id => connectedPlayers[id]?.entity);
  return {
    success: true,
    chunk: ctx.chunk.id,
    player: ctx.player,
    entity: ctx.entity,
    players: playerEntities,
  };
}
