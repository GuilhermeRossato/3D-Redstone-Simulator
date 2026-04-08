/**
 * Recursively search an object for keys matching the selector.
 * Selector can be:
 * - string: match key exactly
 * - array of strings: match any key in the array
 * - Set of strings: match any key in the set
 * - function: custom function (key, value) => boolean
 * @param {any} obj 
 * @param {string | string[] | Set<string> | ((key: string, value: any) => boolean)} selector 
 * @param {Set<any> | Array<any>} list 
 * @param {*} maxDepth 
 * @returns 
 */
export function recursiveObjectSearch(obj, selector, list = [], maxDepth = 3) {
  if (!obj || typeof obj !== 'object' || maxDepth < 0) {
    return list;
  }
  if (selector && typeof selector === 'string') {
    // @ts-ignore
    selector = (key) => key === selector;
  } else if (selector && typeof selector === 'object' && Array.isArray(selector)) {
    // @ts-ignore
    selector = (key) => selector.includes(key);
  } else if (selector && typeof selector === 'object' && selector instanceof Set) {
    // @ts-ignore
    selector = (key) => selector.has(key);
  } else if (typeof selector !== 'function') {
    throw new Error('Invalid selector type');
  }
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const value = obj[key];
    const veredict = selector(key, value);
    if (veredict) {
      if (list && Array.isArray(list)) {
        list.push(value);
      } else if (list && list instanceof Set) {
        list.add(value);
      } else {
        return value;
      }
      continue;
    }
    recursiveObjectSearch(value, selector, list, maxDepth - 1);
  }
  return list;
}