/**
 * Parses a generic argument of many forms into a pose array.
 * @return {[number, number, number, number, number, number]}
 */
export function normalizePose(obj) {
  if (!obj) {
    throw new Error("Invalid pose argument");
  }
  const pose =
    typeof obj === "string" &&
    obj.split("x").filter((f) => f.trim().length).length === 3
      ? obj.split("x")
      : obj.pose instanceof Array && obj.pose.length >= 3
      ? obj.pose
      : obj.position instanceof Array && obj.position.length >= 3
      ? obj.position
      : typeof obj.x === "number" && isNaN(obj.x)
      ? [obj.x, obj.y, obj.z]
      : [0, 0, 0];
  if (
    pose.length === 3 &&
    obj &&
    typeof obj === "object" &&
    (typeof obj.yaw !== "number" || isNaN(obj.yaw)) &&
    typeof obj.rotation === "object" &&
    typeof obj.rotation.x === "number" &&
    !isNaN(obj.rotation.x) &&
    typeof obj.rotation.y === "number" &&
    !isNaN(obj.rotation.y) &&
    typeof obj.rotation.z === "number" &&
    !isNaN(obj.rotation.z)
  ) {
    pose.push(obj.rotation.x);
    pose.push(obj.rotation.y);
    pose.push(obj.rotation.z);
  } else if (pose.length === 3 && obj && typeof obj === "object") {
    const rot =
      typeof obj.yaw === "number" && !isNaN(obj.yaw) ? obj : obj.rotation || {};
    if (typeof rot.yaw === "number" && !isNaN(rot.yaw)) {
      pose.push(rot.yaw);
      if (typeof rot.pitch === "number" && !isNaN(rot.pitch)) {
        pose.push(rot.pitch);
        if (typeof rot.roll === "number" && !isNaN(rot.roll)) {
          pose.push(rot.roll);
        }
      }
    } else if (
      typeof rot === "object" &&
      rot instanceof Array &&
      (rot.length === 2 || rot.length === 3) &&
      rot.every((v) => !isNaN(v))
    ) {
      pose.push(...rot);
    }
  }
  if (pose.length === 3) {
    pose.push(0, 0, 0);
  }
  if (pose.length === 5) {
    pose.push(0);
  }
  if (pose.some((a) => isNaN(a))) {
    throw new Error(
      `Invalid pose values:${pose
        .map((a, i) => `pose[${i}] = ${JSON.stringify(a)}`)
        .join(", ")}`
    );
  }
  return pose;
}
