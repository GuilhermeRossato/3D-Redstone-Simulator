export default async function punch(payload, ctx) {
  
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
  })
}
