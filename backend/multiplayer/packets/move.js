export async function move(payload, context) {
  const { type, x, y, z, yaw, pitch, replyId } = payload;
  if (type !== "move") {
    throw new Error("Invalid sync packet type");
  }
  if (!context.entity) {
    throw new Error("Invalid context entity");
  }
  context.entity.update({
    position: [x, y, z],
    direction: [yaw, pitch, 0],
  });
  if (replyId) {
    return { serverTime: new Date().getTime(), success: true };
  }
}
