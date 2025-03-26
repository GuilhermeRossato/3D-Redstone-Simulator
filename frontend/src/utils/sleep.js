/**
 * Returns a promise that asynchronously resolves after a specified duration.
 * @param {number} [ms=100] - The number of milliseconds to sleep for.
 * @returns {Promise<void>} A promise that resolves after the specified duration.
 */
export function sleep(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, Math.floor(ms)));
}
