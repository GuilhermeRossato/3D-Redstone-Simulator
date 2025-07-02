import { savePlayer } from "../../lib/PlayerStorage.js";

export async function move(payload, context) {
  const { type, x, y, z, yaw, pitch, pose, replyId } = payload;
  if (type !== "move") {
    throw new Error("Invalid move packet type");
  }
  if (!context.player) {
    throw new Error("Invalid context player");
  }
  if (!context.entity) {
    throw new Error("Invalid context entity: Player did not spawn");
  }
  context.player.pose = pose || [x, y, z, yaw, pitch];
  await context.entity.update("pose", context.player.pose);
  if (replyId) {
    return { server: new Date().getTime(), success: true };
  }
}
