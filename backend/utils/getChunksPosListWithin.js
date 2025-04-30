/**
 * Returns a list of chunk positions within the specified range from the origin.
 * The list is sorted by distance from the origin.
 *
 * @param {[number, number, number]} corigin
 * @param {number | [number, number, number]} ctarget
 * @param {[number, number, number]} [center]
 * @returns {[number, number, number, number][]} List of chunk positions and their distance from the origin
 */
export function getChunksPosListWithin(corigin, ctarget, center) {
  if (!corigin) {
    throw new Error("Invalid origin");
  }
  if (typeof ctarget === "number") {
    corigin[0] -= ctarget / 2;
    corigin[1] -= ctarget / 2;
    corigin[2] -= ctarget / 2;
    ctarget = [
      corigin[0] + ctarget,
      corigin[1] + ctarget,
      corigin[2] + ctarget,
    ];
    if (!center?.length) {
      center = [
        (corigin[0] + ctarget[0]) / 2,
        (corigin[1] + ctarget[1]) / 2,
        (corigin[2] + ctarget[2]) / 2,
      ];
    }
  } else if (!center?.length) {
    center = corigin;
  }
  const xmin = Math.floor(Math.min(corigin[0], ctarget[0]));
  const xmax = Math.ceil(Math.max(corigin[0], ctarget[0]));
  const ymin = Math.floor(Math.min(corigin[1], ctarget[1]));
  const ymax = Math.ceil(Math.max(corigin[1], ctarget[1]));
  const zmin = Math.floor(Math.min(corigin[2], ctarget[2]));
  const zmax = Math.ceil(Math.max(corigin[2], ctarget[2]));
  const chunks = [];
  const cpos = [xmin, ymin, zmin];
  const deltas = [0, 0, 0];
  for (cpos[0] = xmin; cpos[0] <= xmax; cpos[0]++) {
    deltas[0] = cpos[0] - center[0];
    deltas[0] = deltas[0] * deltas[0];
    for (cpos[1] = ymin; cpos[1] <= ymax; cpos[1]++) {
      deltas[1] = cpos[1] - center[1];
      deltas[1] = deltas[1] * deltas[1];
      for (cpos[2] = zmin; cpos[2] <= zmax; cpos[2]++) {
        deltas[2] = cpos[2] - center[2];
        deltas[2] = deltas[2] * deltas[2];
        if (chunks.length > 1024) {
          throw new Error("Chunk list too long");
        }
        chunks.push([
          cpos[0],
          cpos[1],
          cpos[2],
          Math.sqrt(deltas[0] + deltas[1] + deltas[2]),
        ]);
      }
    }
  }
  // @ts-ignore
  return chunks.sort((a, b) => a[3] - b[3]);
}
