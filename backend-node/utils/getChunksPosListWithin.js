/**
 * Iterates over a range of chunk coords and returns the list of chunk positions sorted in ascending order by the cubic distance between it and the middle point.
 *
 * @param {number[]} corigin The chunk coordinates of the origin point
 * @param {number[]} ctarget The chunk coordinates of the target point
 * @param {number[]} [cmiddle] Optional middle chunk coordinates (if unset the middle of the range is used)
 * @returns {[number, number, number, number][]} List of chunk positions and their cubic distance from the origin
 */
export function getChunksPosListWithin(corigin, ctarget, cmiddle = undefined) {
  const xmin = Math.floor(Math.min(corigin[0], ctarget[0]));
  const ymin = Math.floor(Math.min(corigin[1], ctarget[1]));
  const zmin = Math.floor(Math.min(corigin[2], ctarget[2]));
  const xmax = Math.ceil(Math.max(corigin[0], ctarget[0]));
  const ymax = Math.ceil(Math.max(corigin[1], ctarget[1]));
  const zmax = Math.ceil(Math.max(corigin[2], ctarget[2]));
  const [xmid, ymid, zmid] =
    cmiddle?.length === 3
      ? cmiddle
      : [(xmin + xmax) / 2, (ymin + ymax) / 2, (zmin + zmax) / 2];
  let cx = xmin;
  let cy = ymin;
  let cz = zmin;
  /** @type {[number, number, number, number][]} */
  const chunks = [];
  const deltas = [0, 0, 0];
  for (cx = xmin; cx <= xmax; cx++) {
    deltas[0] = cx - xmid;
    deltas[0] *= deltas[0];
    for (cy = ymin; cy <= ymax; cy++) {
      deltas[1] = cy - ymid;
      deltas[1] *= deltas[1];
      for (cz = zmin; cz <= zmax; cz++) {
        deltas[2] = cz - zmid;
        deltas[2] *= deltas[2];
        if (chunks.length > 10_000) {
          throw new Error("Chunk list too long");
        }
        chunks.push([cx, cy, cz, deltas[0] + deltas[1] + deltas[2]]);
      }
    }
  }
  return chunks.sort((a, b) => a[3] - b[3]);
}

/**
 * Returns a list of chunk positions within the specified range from the origin coords sorted by the distance to it.
 *
 * @param {[number, number, number]} corigin The chunk coordinates of the center point.
 * @param {number} radius The distance between the origin chunk and the maximum offset to be selected.
 * @returns {[number, number, number, number][]} List of chunk positions and their distance from the center.
 */
export function getChunksPosListByDistance(corigin, radius) {
  const r = radius / 16;
  const [min, max] = [1, -1].map((sign) => corigin.map((v) => v + sign * r));
  const list = getChunksPosListWithin(min, max);
  const filtered = list.filter((a) => a[3] <= r * r * r);
  if (list.length && !filtered.length) {
    console.warn("Warning: No chunks found within the specified distance");
    return [list[0]];
  }
  return filtered;
}
