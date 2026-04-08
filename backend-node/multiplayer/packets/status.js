export async function status(payload, ctx) {
  if (payload.hidden!==undefined) {
    if (ctx.unfocused !== Boolean(payload.hidden)) {
      console.log(`Status changed: unfocused is now ${Boolean(payload.hidden)}`);
    }
    ctx.unfocused = Boolean(payload.hidden);
  }
  if (payload.idle!==undefined) {
    if (ctx.idle !== Boolean(payload.idle)) {
      console.log(`Status changed: idle is now ${Boolean(payload.idle)}`);
    }
    ctx.idle = Boolean(payload.idle);
  }
}