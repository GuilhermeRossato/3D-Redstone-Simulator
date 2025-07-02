import { ServerEntityEventHandler } from "../../lib/entities/ServerEntityHandler.js";
import { createServerEntity, removeEntity } from "../../lib/EntityStorage.js";
import { GameEventEmitter } from "../../lib/GameEventEmitter.js";
import { loadPlayer, savePlayer } from "../../lib/PlayerStorage.js";
import { ServerChunk } from "../../lib/ServerChunk.js";

export default async function spawn(payload, ctx) {
  if (!ctx.player || typeof ctx.player !== "object") {
    throw new Error("Invalid context object: Player is not initialized");
  }
  if (ctx.entity) {
    console.log(
      "Received spawn entity event but entity already exists:",
      ctx.player.entity
    );
  }
  const health = ctx.player.health;
  const life = ctx.player.maxHealth;
  if (ctx.player.entity) {
    console.log("Removing old entity", ctx.player.entity);
    await removeEntity(ctx.player.entity);
  }
  const creation = await createServerEntity({
    player: ctx.player.id,
    pose: ctx.player.pose,
    path: [ctx.player.pose].slice(1),
    health: health === undefined || typeof health !== "number" ? 20 : health,
    maxHealth: life === undefined || typeof life !== "number" ? 20 : life,
  });
  
  ServerEntityEventHandler.addEntityToScene(creation.state);

  GameEventEmitter.dispatch("entity", "spawn", ctx.player.pose)
  ctx.entity = creation.state;
  console.log(`Created entity to spawn:`, ctx.entity);
  ctx.player = await loadPlayer(ctx.player.id);
  console.log(`Loaded player to spawn:`, ctx.player);
  ctx.player.entity = ctx.entity.id;
  ctx.player.health = ctx.entity.health;
  ctx.player.maxHealth = ctx.entity.maxHealth;
  await savePlayer(ctx.player);
  const absolute = ctx.player.pose.slice(0, 3).map((a) => Math.floor(a));
  const [cx, cy, cz] = absolute.map((a) => Math.floor(a / 16));
  const chunk = ServerChunk.from(cx, cy, cz);
  GameEventEmitter.on(
    "entity",
    [creation.state.section, chunk, absolute.join(",")],
    (event, ctx) => {
      console.log("Entity event", event, ctx);
      return false;
    }
  );
  GameEventEmitter.dispatch(
    "entity",
    [creation.state.pos, ctx.chunk.id, creation.state.section],
    {
      spawn: ctx.entity.id,
      player: ctx.player.id,
      section: creation.state.section,
    }
  );
  GameEventEmitter.on("entity", ctx.chunk.id, (event, ctx) => {
    console.log("Entity event", event, ctx);
  });
  return {
    player: ctx.player,
    entity: ctx.entity,
  };
}
