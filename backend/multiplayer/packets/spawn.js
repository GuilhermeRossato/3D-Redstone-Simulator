import { ServerEntityEventHandler } from "../../lib/entities/ServerEntityHandler.js";
import { createServerEntity, loadServerEntity, removeEntity } from "../../lib/EntityStorage.js";
import { GameEventEmitter } from "../../lib/GameEventEmitter.js";
import { getNewPlayerSpawnPose, loadPlayer, savePlayer } from "../../lib/PlayerStorage.js";
import { ServerChunk } from "../../lib/ServerChunk.js";
import { connectedPlayers, ServerRegion } from "../../lib/ServerRegion.js";

export default async function spawn(payload, ctx) {
  if (!ctx.player || typeof ctx.player !== "object") {
    throw new Error("Invalid context object: Player is not initialized");
  }
  if (ctx.player.entity) {
    console.log(
      "Received spawn entity event with", payload, "but player entity already exists:", ctx.player.entity, "of player",
      ctx.player
    );
  }
  if (!ctx.send) {
    throw new Error("Context does not have a send function");
  }
  if (!ctx.player) {
    throw new Error("Context does not have a player entry");
  }
  if (payload.type !== "spawn") {
    throw new Error("Invalid spawn packet type");
  }
  const is_payload_with_offset = typeof payload.offset === 'number' && !isNaN(payload.offset);
  if (is_payload_with_offset) {
    ctx.offset = payload.offset;
  } else if (typeof ctx.offset !== 'number' || isNaN(ctx.offset)) {
    ctx.offset = 0;
  }
  const health = ctx.player.health;
  const life = ctx.player.maxHealth;
  let entityId = payload.entityId;
  if (typeof entityId !== "string" || !entityId || entityId.length < 5 || !entityId.startsWith("e")) {
    entityId = `e${Math.random().toString(36).substring(2, 10)}`;
  }
  let pose = (payload.pose instanceof Array && payload.pose.length >= 3 && typeof payload.pose[0] == 'number' && !isNaN(payload.pose[0]) && typeof payload.pose[1] == 'number' && !isNaN(payload.pose[1]) && typeof payload.pose[2] == 'number' && !isNaN(payload.pose[2])) ? payload.pose : [...ctx.player.pose];
  if (isNaN(pose[0]) || isNaN(pose[1]) || isNaN(pose[2])) {
    pose = getNewPlayerSpawnPose(ctx.player.name);
  }
  if (entityId && ctx.player.entities && ctx.player.entities instanceof Array && ctx.player.entities.length > 0 && ctx.player.entities.find(e => e.id === entityId)) {
    pose = getNewPlayerSpawnPose(ctx.player.name);
    entityId = `e${Math.random().toString(36).substring(2, 10)}`;
  }
  const region = ServerRegion.fromAbsolute(pose);
  ctx.entity = await region.add({
    type: "spawn",
    id: entityId,
    region: region.id,
    player: ctx.player.id,
    name: payload.name || ctx.player.name,
    spawned: new Date().getTime(),
    pose,
    health: typeof health !== "number" || isNaN(health) ? 20 : health,
    maxHealth: typeof life !== "number" || isNaN(life) ? 20 : life,
  });
  if (!ctx.entity || !ctx.entity.id) {
    throw new Error("Failed to create entity for player spawn");
  }
  if (!region.state.entities[ctx.entity.id]) {
    console.log("Warning: Entity", ctx.entity.id, "does not exists on region", region.id, "from player", ctx.player.id);
  }
  if (!region.state.players[ctx.player.id]) {
    console.log("Warning: Player not connected on region", region.id, "after spawn event");
  }
  ctx.region = region;
  ctx.chunk = ServerChunk.fromAbsolute(ctx.entity.pose);
  if (!ctx.player.entities || !(ctx.player.entities instanceof Array)) {
    ctx.player.entities = [];
  }
  ctx.player.entities.push({ id: ctx.entity.id, region: region.id });
  ctx.player.entity=ctx.entity.id;
  await savePlayer(ctx.player);
  const regionEntities = await Promise.all(ServerRegion.getSurroundingRegions(ctx.entity.pose, 64, true).map((region) => region.getEntities()));
  const entities = regionEntities.flat().filter((e) => e && e.id && e.id !== ctx.entity.id);
  if (connectedPlayers[ctx.entity.id]) {
    console.log("Warning: Player entity already connected on spawn", ctx.player.id, ctx.entity.id);
  }
  connectedPlayers[ctx.entity.id] = ctx;
  return {
    success: true,
    chunk: ctx.chunk.id,
    player: ctx.player,
    entity: ctx.entity,
    entities,
  };
}
