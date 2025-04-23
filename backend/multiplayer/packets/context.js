import { chunks } from "../../lib/storage.js";

async function getSurroundingWorld(origin, target) {
  if (typeof target === "number") {
    origin[0] -= target;
    origin[1] -= target;
    origin[2] -= target;
    target = [origin[0] + target * 2, origin[1] + target, origin[2] + target];
  }
  const xmin = Math.floor(Math.min(origin[0], target[0]) / 16);
  const xmax = Math.ceil(Math.max(origin[0], target[0]) / 16);
  const ymin = Math.floor(Math.min(origin[1], target[1]) / 16);
  const ymax = Math.ceil(Math.max(origin[1], target[1]) / 16);
  const zmin = Math.floor(Math.min(origin[2], target[2]) / 16);
  const zmax = Math.ceil(Math.max(origin[2], target[2]) / 16);
  const ids = [];
  for (let x = xmin; x <= xmax; x++) {
    for (let y = ymin; y <= ymax; y++) {
      for (let z = zmin; z <= zmax; z++) {
        ids.push(`c-${x}-${y}-${z}`);
      }
    }
  }
  return chunks.load(ids.length, {
    id: ids,
  });
}
export async function context(payload, ctx) {
  const { offset } = payload;
  if (typeof offset !== "number" || isNaN(offset)) {
    throw new Error("Invalid sync packet type");
  }
  if (!ctx.player) {
    throw new Error("Invalid context missing player");
  }
  if (!ctx.entity) {
    throw new Error("Invalid context missing entity");
  }

  const world = await getSurroundingWorld(ctx.entity.state.position, 64);
  return {
    player: ctx.player,
    entity: ctx.entity,
    world,
  };
}
