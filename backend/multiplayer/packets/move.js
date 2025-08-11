import { connectedPlayers, ServerRegion } from "../../lib/ServerRegion.js";

// helper to check if an entity is present in the record by key
const hasEntityInRegion = (entities, id) => {
  return Boolean(entities[id] || entities['e' + id]);
};

export async function move(payload, ctx) {
  if (!ctx.player) {
    throw new Error("Invalid context player");
  }
  if (!ctx.entity) {
    throw new Error("Invalid context entity: Player did not spawn");
  }
  if (!ctx.entity.pose) {
    throw new Error("Invalid context entity pose");
  }
  payload.pose.forEach((p, i) => {
    if (typeof p !== "number" || isNaN(p) || i > 6) {
      throw new Error(`Invalid pose value at index ${i}: ${p}`);
    }
  });
  const reg = ServerRegion.fromAbsolute(payload.pose);
  const evts = [];
  if (!ctx.region) {
    console.log(`Entity ${ctx.entity.id} moving to region ${reg.id} at pose ${payload.pose.join(', ')}`);
    ctx.region = reg;
    evts.push(await ctx.region.add({
      type: "enter",
      entity: ctx.entity.id,
      player: ctx.player.id,
      pose: payload.pose,
    }));
    if (hasEntityInRegion(ctx.region.state.entities, ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} still present in region ${ctx.region.id} after leave event`);
    }
  } else if (ctx.region.id !== reg.id) {
    console.log(`Region mismatch: current region ${ctx.region.id} will lose entity to ${reg.id}`);
    if (!ctx.region.loaded) {
      await ctx.region.load();
    }
    if (!hasEntityInRegion(ctx.region.state.entities, ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} not present in region ${ctx.region.id} before leave event`);
    }
    evts.push(await ctx.region.add({
      type: "leave",
      id: ctx.entity.id,
      player: ctx.player.id,
      pose: payload.pose,
    }));
    if (hasEntityInRegion(ctx.region.state.entities, ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} still present in region ${ctx.region.id} after leave event`);
    }
    ctx.region = reg;
    if (!ctx.region.loaded) {
      await ctx.region.load();
    }
    if (hasEntityInRegion(ctx.region.state.entities, ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} already present in target region ${ctx.region.id} before enter event`);
    }
    evts.push(await ctx.region.add({
      type: "enter",
      id: ctx.entity.id,
      player: ctx.player.id,
      pose: payload.pose,
    }));
    if (!hasEntityInRegion(ctx.region.state.entities, ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} not present in target region ${ctx.region.id} after enter event`);
    }
  } else {
    //console.log(`Entity ${ctx.entity.id} moving within the same region ${ctx.region.id} to pose ${payload.pose.join(', ')}`);
    evts.push(await ctx.region.add({
      type: "move",
      id: ctx.entity.id,
      player: ctx.player.id,
      pose: payload.pose,
    }));
  }
  if (payload.replyId) {
    return { success: true, server: new Date().getTime(), pose: ctx.entity.pose };
  }
}
