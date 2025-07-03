import { ServerEntityEventHandler } from "../../lib/entities/ServerEntityHandler.js";
import { createServerEntity, loadServerEntity, removeEntity } from "../../lib/EntityStorage.js";
import { GameEventEmitter } from "../../lib/GameEventEmitter.js";
import { loadPlayer, savePlayer } from "../../lib/PlayerStorage.js";
import { ServerChunk } from "../../lib/ServerChunk.js";
import { ServerRegion } from "../../lib/ServerRegion.js";

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
  ctx.player = await loadPlayer(ctx.player.id);
  const health = ctx.player.health;
  const life = ctx.player.maxHealth;
  if (ctx.entity?.id) {
    ctx.entity = await loadServerEntity(ctx.entity.id);
  } else if (ctx.player?.entity) {
    ctx.entity = await loadServerEntity(ctx.player.entity);
  }
  if (!ctx.entity || !ctx.entity.id) {
    ctx.entity = await createServerEntity({
      id: Math.random().toString(36).substring(2, 8),
      player: ctx.player.id,
      name: ctx.player.name,
      pose: [...ctx.player.pose],
      health: health === undefined || typeof health !== "number" ? 20 : health,
      maxHealth: life === undefined || typeof life !== "number" ? 20 : life,
    });
  }
  ctx.region = ServerRegion.fromAbsolute(ctx.entity.pose || ctx.player.pose);
  ServerRegion.addConnectedPlayer(ctx);
  ctx.player.entity = ctx.entity.id;
  ctx.entity.player = ctx.player.id;
  const pose = [...(ctx.entity.pose || ctx.player.pose)];
  ctx.chunk = ServerChunk.fromAbsolute(pose);
  ctx.entity.chunk = ctx.chunk.id;
  ctx.player.entity = ctx.entity.id;
  ctx.player.health = ctx.entity.health;
  ctx.player.maxHealth = ctx.entity.maxHealth;
  const name = ctx.player.name || ctx.entity.name;
  const evt = await ctx.region.add({
    type: "spawn",
    entity: ctx.entity.id,
    player: ctx.player.id,
    name,
    pose,
  });
  ctx.player.spawned = evt.time;
  await savePlayer(ctx.player);
  return {
    success: true,
    chunk: ctx.chunk.id,
    player: ctx.player,
    entity: ctx.entity,
  };
}
