/**
 * @param {number} i
 * @param {number} j
 * @param {number} t
 */
export function b(i, j, t) {
  if (typeof i !== 'number' || typeof j !== 'number' || isNaN(i) || isNaN(j) || isNaN(t) || i + j + t === Infinity) {
    throw new Error(`Invalid parameters: ${JSON.stringify([i, j, t])}`);
  }
  return i + (j - i) * t;
}
/**
 * @param {number} i
 * @param {number} j
 * @param {number} k
 */


export function ib(i, j, k) {
  if (typeof i !== "number" ||
    isNaN(i) ||
    typeof j !== "number" ||
    isNaN(j) ||
    typeof k !== "number" ||
    isNaN(k)) {
    throw new Error(`Invalid parameters: ${JSON.stringify({ i, j, k })}`);
  }
  if (j === i) {
    return 0;
  }
  return (k - i) / (j - i);
}
