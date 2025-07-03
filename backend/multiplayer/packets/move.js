import { ServerRegion } from "../../lib/ServerRegion.js";

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
    if (typeof p !== "number" || isNaN(p)) {
      throw new Error(`Invalid pose value at index ${i}: ${p}`);
    }
    ctx.entity.pose[i] = p;
  });
  if (!ctx.region) {
    ctx.region = ServerRegion.fromAbsolute(ctx.entity.pose || ctx.player.pose);
  }
  const evt = await ctx.region.add({
    type: "move",
    entity: ctx.entity.id,
    player: ctx.player.id,
    pose: ctx.entity.pose,
  });
  if (evt.exited) {
    console.log('Exiting region', ctx.region.id, 'for entity', ctx.entity.id);
    const next = ServerRegion.fromAbsolute(ctx.entity.pose);
    ctx.region = next;
    ctx.entity.region = ctx.region.id;
    await ctx.region.add({
      type: "move",
      entity: ctx.entity.id,
      player: ctx.player.id,
      pose: ctx.entity.pose,
    });
  }
  if (payload.replyId) {
    return { server: new Date().getTime(), pose: ctx.entity.pose, success: true };
  }
}
