export function b(i, j, t) {
  if (typeof i !== 'number' || typeof j !== 'number' || isNaN(i) || isNaN(j) || isNaN(t)) {
    throw new Error(`One of the parameters is invalid: ${JSON.stringify([i, j, t])}`);
  }
  return i + (j - i) * t;
}
