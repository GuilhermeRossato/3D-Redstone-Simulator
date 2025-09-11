import { ServerEntityEventHandler } from "../../lib/entities/ServerEntityHandler.js";
import { createServerEntity, loadServerEntity, removeEntity } from "../../lib/EntityStorage.js";
import { GameEventEmitter } from "../../lib/GameEventEmitter.js";
import { getPlayerContextPose, loadPlayer, playerCache, savePlayer } from "../../lib/PlayerStorage.js";
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
  if (isNaN(payload.replyId)) {
    throw new Error("Invalid spawn packet missing reply id");
  }
  const is_payload_with_offset = typeof payload.offset === 'number' && !isNaN(payload.offset);
  if (is_payload_with_offset) {
    ctx.offset = payload.offset;
  } else if (typeof ctx.offset !== 'number' || isNaN(ctx.offset)) {
    ctx.offset = 0;
  }
  ctx.pose = getPlayerContextPose(payload, ctx);
  ctx.entityId = ctx.entityId || payload.entityId;
  let entity;
  let closest;
  let distance = undefined;
  for (let i = 0; i < ctx.player.entities.length && ctx.entityId; i++) {
    const e = ctx.player.entities[i];
    if (e.pose && e.pose instanceof Array && e.pose.length > 3) {
      e.region = ServerRegion.fromAbsolute(e.pose).id;
    }
    if (e.region) {
      const r = ServerRegion.from(e.region);
      if (r.state && r.state.entities && r.state.entities[e.id]) {
        if (e.id === ctx.entityId) {
          console.log('Cannot reuse entity', e.id, 'for player', ctx.player.id, 'because it is already spawned at', r.id);
        }
        continue;
      }
    }
    if (e.id === ctx.entityId) {
      entity = e;
    }
    if (e.pose && e.pose instanceof Array && e.pose.length > 3) {
      const dx = e.pose[0] - ctx.pose[0];
      const dy = e.pose[1] - ctx.pose[1];
      const dz = e.pose[2] - ctx.pose[2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (isNaN(d)) {
        continue;
      }
      if (distance === undefined || distance > d) {
        distance = d;
        closest = e;
      }
    }
  }
  let health = ctx.health || ctx.player.health;
  let maxHealth = ctx.maxHealth || ctx.player.maxHealth;
  if (!entity && closest && distance !== undefined) {
    entity = closest;
    console.log("Using closest entity", entity.id, "for player", ctx.player.id, "at distance", distance.toFixed(2));
  }
  if (entity) {
    console.log("Matched entity id", entity.id, "for player", ctx.player.id, "at spawn:", entity);
    ctx.entityId = entity.id;
    if (entity.pose) {
      ctx.pose = entity.pose;
    } else {
      entity.pose = ctx.pose;
    }
  }
  if (!ctx.player.entities || !(ctx.player.entities instanceof Array)) {
    ctx.player.entities = entity ? [entity] : [];
  }
  if (typeof ctx.entityId !== "string" || !ctx.entityId || ctx.entityId.length < 5) {
    if (ctx.player.entities && ctx.player.entities instanceof Array && ctx.player.entities.length) {
      entity = ctx.player.entities.find(e => e.id && !(e.region ? ServerRegion.from(e.region) : ServerRegion.fromAbsolute(e.pose))?.state?.entities?.[e.id]) || ctx.player.entities.find(e => e.id) || ctx.player.entities[0];
    }
    if (entity) {
      ctx.entityId = entity.id;
      ctx.pose = entity.pose || ctx.pose;
    }
  }
  if (entity) {
    console.log("Assigned existing entity", entity.id, "for player", ctx.player.id);
    ctx.entityId = entity.id;
    if (entity.pose) {
      ctx.pose = entity.pose;
    } else {
      entity.pose = ctx.pose;
    }
    if (entity.name) {
      ctx.name = entity.name;
    }
    if (typeof entity.health === 'number' && !isNaN(entity.health)) health = entity.health;
    if (typeof entity.maxHealth === 'number' && !isNaN(entity.maxHealth)) maxHealth = entity.maxHealth;
  }
  if (typeof ctx.entityId === "string" && !ctx.entityId.startsWith('e')) {
    ctx.entityId = `e${ctx.entityId.substring(0)}`;
  }
  if (typeof ctx.entityId !== "string" || !ctx.entityId || ctx.entityId.length < 5) {
    ctx.entityId = `e${Math.random().toString(36).substring(2, 10)}`;
  }
  if (ctx.pose === null || ctx.pose === undefined || ctx.pose[0] === null || ctx.pose[0] === undefined) {
    throw new Error(`Invalid player pose: ${JSON.stringify(ctx.pose)}`);
  }
  const region = ServerRegion.fromAbsolute(ctx.pose);
  if (region?.state?.entities && ctx.entityId && region.state.entities[ctx.entityId]) {
    console.warn("Warning: Entity", ctx.entityId, "already exists on region", region.id, "for player", ctx.player.id, "when spawning.");
  }
  // emit spawn event
  ctx.entity = await region.add({
    type: "spawn",
    id: ctx.entityId,
    region: region.id,
    player: ctx.player.id,
    name: payload.name || ctx.player.name,
    spawned: new Date().getTime(),
    pose: ctx.pose,
    health: typeof health !== "number" || isNaN(health) ? 20 : health,
    maxHealth: typeof maxHealth !== "number" || isNaN(maxHealth) ? 20 : maxHealth,
  });
  
  if (!ctx.entity || !ctx.entity.id) {
    throw new Error("Failed to create entity for player spawn");
  }

  ctx.health = ctx.entity.health;
  ctx.maxHealth = ctx.entity.maxHealth;

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
  if (ctx.player.entities.length > 4) {
    ctx.player.entities = ctx.player.entities.slice(0, 4);
  }
  const match = ctx.player.entities.find((e) => e && e.id === ctx.entity.id);
  const entry = { id: ctx.entity.id, region: region.id, pose: ctx.entity.pose, health: ctx.entity.health, maxHealth: ctx.entity.maxHealth, spawned: Date.now() };
  if (match) {
    Object.assign(match, entry);
  } else {
    ctx.player.entities.unshift(entry);
  }
  ctx.player.spawned = Date.now();
  
  await savePlayer(ctx.player);
  
  ctx.entityId = ctx.entity.id;
  const regionEntities = await Promise.all(ServerRegion.getSurroundingRegions(ctx.entity.pose, 64, true).map((region) => region.getEntities()));
  const entities = regionEntities.flat().filter((e) => e && e.id && e.id !== ctx.entityId);
  console.log(`Found ${entities.length} nearby entities for player`, [ctx.player.name], "at region", region.id, "entity", ctx.entityId);
  if (connectedPlayers[ctx.entityId]) {
    console.log("Warning: Player entity already connected on spawn", ctx.player.id, ctx.entityId);
  }
  connectedPlayers[ctx.entityId] = ctx;
  return {
    success: true,
    chunk: ctx.chunk.id,
    player: ctx.player,
    playerId: ctx.player.id,
    entity: ctx.entity,
    entityId: ctx.entity.id,
    entities,
  };

}


