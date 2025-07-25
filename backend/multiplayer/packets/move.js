import { connectedPlayers, ServerRegion } from "../../lib/ServerRegion.js";

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
    if (typeof p !== "number" || isNaN(p)||i>6) {
      throw new Error(`Invalid pose value at index ${i}: ${p}`);
    }
    //ctx.entity.pose[i] = p;
  });
  const reg = ServerRegion.fromAbsolute(payload.pose);
  const evts = [];
  if (!ctx.region) {
    ctx.region = reg;
    evts.push(await ctx.region.add({
      type: "enter",
      entity: ctx.entity.id,
      player: ctx.player.id,
      pose: payload.pose,
    }));
    if (ctx.region.state.entities.find(e => e.id === ctx.entity.id||e.id === 'e'+ctx.entity.id||'e'+e.id === ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} still present in region ${ctx.region.id} after leave event`);
    }
  } else if (ctx.region.id !== reg.id) {
    console.log(`Region mismatch: current region ${ctx.region.id} will lose entity to ${reg.id}`);
    if (!ctx.region.state.entities.find(e => e.id === ctx.entity.id||e.id === 'e'+ctx.entity.id||'e'+e.id === ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} not present in region ${ctx.region.id} before leave event`);
    }
    evts.push(await ctx.region.add({
      type: "leave",
      entity: ctx.entity.id,
      player: ctx.player.id,
      pose: payload.pose,
    }));
    if (ctx.region.state.entities.find(e => e.id === ctx.entity.id||e.id === 'e'+ctx.entity.id||'e'+e.id === ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} still present in region ${ctx.region.id} after leave event`);
    }
    ctx.region = reg;
    if (ctx.region.state.entities.find(e => e.id === ctx.entity.id||e.id === 'e'+ctx.entity.id||'e'+e.id === ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} already present in target region ${ctx.region.id} before enter event`);
    }
    evts.push(await ctx.region.add({
      type: "enter",
      entity: ctx.entity,
      player: ctx.player.id,
      pose: payload.pose,
    }));
    if (!ctx.region.state.entities.find(e => e.id === ctx.entity.id||e.id === 'e'+ctx.entity.id||'e'+e.id === ctx.entity.id)) {
      console.warn(`Warning: Entity ${ctx.entity.id} already present in target region ${ctx.region.id} before enter event`);
    }
  } else {
    evts.push(await ctx.region.add({
      type: "move",
      entity: ctx.entity.id,
      player: ctx.player.id,
      pose: payload.pose,
    }));
  }
  if (payload.replyId) {
    return { success: true, server: new Date().getTime(), pose: ctx.entity.pose };
  }
}
