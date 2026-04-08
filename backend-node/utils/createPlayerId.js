export const expectedPlayerIdLength = 1 + 2 + 2 + 7;

/**
 * @returns {string} A new player id (without the preceding 'p')
 */
export function createPlayerId() {
  const yearDigit = new Date().getFullYear().toString().split('').pop(); // 1
  const monthPair = (new Date().getMonth() + 1).toString().padStart(2, "0"); // 2
  const datePair = new Date().getDate().toString().padStart(2, "0"); // 2
  const randomStr = Math.floor(Math.random() * 8999999 + 1000000).toString(); // 7
  const id = [monthPair, yearDigit, randomStr, datePair].join('');
  if (id.length !== expectedPlayerIdLength) {
    throw new Error(`Generated player id has invalid length: ${id.length} (expected ${1+2+2+7})`);
  }
  return id;
}
