
export async function sync(payload, context) {
  const { type, clientTime, replyId, offset } = payload;
  if (type !== "sync") {
    throw new Error("Invalid sync packet type");
  }
  if (!clientTime) {
    throw new Error("Missing clientTime");
  }
  if (
    typeof offset !== "object" ||
    isNaN(offset[0]) ||
    isNaN(offset[1]) ||
    isNaN(offset[2])
  ) {
    throw new Error("Invalid offset");
  }
  if (!replyId) {
    throw new Error("Missing replyId");
  }
  if (!context.entity) {
    throw new Error("Missing context entity");
  }
  const p = context.entity.state.position;
  const list = chunks.load(1, {
    id: `c-${Math.floor(p[0] / 16 + offset[0])}-${Math.floor(
      p[1] / 16 + offset[1]
    )}-${Math.floor(p[2] / 16 + offset[2])}`,
  });
  const entityList = [];

  return {
    serverTime: new Date().getTime(),
    chunk: list[0],
    entities: entityList,
  };
}
