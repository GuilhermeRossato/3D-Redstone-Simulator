import { updatePlayer } from "../../PlayerStorage.js";

export async function move(payload, context) {
  const { type, x, y, z, yaw, pitch, pose, replyId } = payload;
  if (type !== "move") {
    throw new Error("Invalid move packet type");
  }
  if (!context.player) {
    throw new Error("Invalid context player");
  }
  context.player.pose = pose || [x,y,z,yaw,pitch];
  await updatePlayer(context.player);
  if (replyId) {
    return { serverTime: new Date().getTime(), success: true };
  }
}
