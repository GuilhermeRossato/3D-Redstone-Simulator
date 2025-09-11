export default async function punch(payload, ctx) {
  if (!ctx.entity || !ctx.player) {
    return;
  }
  await ctx.region.add({
    type: 'punch',
    id: ctx.entity.id,
    player: ctx.player.id,
    x: payload.x,
    y: payload.y,
    z: payload.z,
    position: payload.position,
    direction: payload.direction,
    time: Date.now(),
  });
}
