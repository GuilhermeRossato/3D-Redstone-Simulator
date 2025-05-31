import { loadEntity, removeEntity } from "../../lib/EntityStorage.js";
import { loadPlayer, savePlayer } from "../../lib/PlayerStorage.js";

export default async function close(packet, ctx) {
  console.log("Received close packet:", packet, ctx);
  if (ctx.player && ctx.player.entity) {
    const entity = await loadEntity(ctx.player.entity);
    if (entity) {
      console.log("Removing entity", ctx.player.entity); 
    }
    const player = await loadPlayer(ctx.player);
    if (JSON.stringify(player) !== JSON.stringify(ctx.player)) {
      console.log("Player data mismatch, updating player data");
      ctx.player = player;
    }
    if (entity) {
      for (const key in entity) {
        if (
          !['pose', 'health', 'maxHealth', 'name'].includes(key) ||
          entity[key] === null ||
          entity[key] === undefined ||
          ctx.player[key] === null ||
          ctx.player[key] === undefined ||
          typeof ctx.player[key] !== typeof entity[key]
        ) {
          continue;
        }
        if (
          (typeof entity[key] === "string" ||
            typeof entity[key] === "number" ||
            typeof entity[key] === "boolean") &&
          entity[key] === ctx.player[key]
        ) {
          continue;
        }
        console.log(
          "Updating key",
          key,
          "from",
          ctx.player[key],
          "to",
          entity[key]
        );
        ctx.player[key] = entity[key];
      }
      await removeEntity(ctx.player.entity);
    }
    ctx.player.entity = "";
    await savePlayer(ctx.player);
  }
  return {
    type: "close",
    success: true,
  };
}
