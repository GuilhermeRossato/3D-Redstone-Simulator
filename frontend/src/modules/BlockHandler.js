import { g } from "../utils/g.js";

export const FALLBACK_TEXTURE = 'unknown.png';

/**
 * @param {'top' | 'bottom' | 'left' | 'right' | 'front' | 'back'} side
 */
function getSideId(side) {
  return ({
    'top': 0,
    'bottom': 1,
    'left': 2,
    'right': 3,
    'front': 4,
    'back': 5,
  }[side]);
}

/**
 * @param {number} side
 * @returns {'top' | 'bottom' | 'left' | 'right' | 'front' | 'back'}
 */
function getSideName(side) {
  return ({
    '0': 'left',
    '1': 'right',
    '2': 'front',
    '3': 'back',
    '4': 'top',
    '5': 'bottom',
  }[side]);
}

const warnMissing = {};

/**
 * @param {any} blockData
 * @param {number} sideNumber
 * @param {number} x Optional block position to aid in random texture selection
 * @param {number} y
 * @param {number} z
 * @returns {string}
 */
export function getTextureFromBlock(blockData, sideNumber, x = 0, y = 0, z = 0) {
  if (blockData?.texture && typeof blockData?.texture === 'string' && blockData.texture !== FALLBACK_TEXTURE) {
    return blockData.texture;
  }
  const options = ['texture', 'textures', 'textureList'];
  const entries = [];
  for (const opt of options) {
    if (blockData?.hasOwnProperty(opt)) {
      entries.push([1, blockData, opt]);
      if (typeof blockData[opt] === 'function') {
        entries[entries.length - 1][0] += 10;
      }
    }
    if (blockData?.data?.hasOwnProperty(opt)) {
      entries.push([2, blockData?.data, opt]);
      if (typeof blockData[opt] === 'function') {
        entries[entries.length - 1][0] += 10;
      }
    }
    if (blockData?.data?.data?.hasOwnProperty(opt)) {
      entries.push([3, blockData?.data?.data, opt]);
      if (typeof blockData[opt] === 'function') {
        entries[entries.length - 1][0] += 10;
      }
    }
  }
  const list = entries.sort((a, b) => a[0] - b[0]).map(([, obj, key]) => obj[key]);
  const filtered = list.flatMap(a => typeof a === 'string' && a && a !== FALLBACK_TEXTURE ? [a] : a instanceof Array ? a : []);

  if (filtered.length === 0) {
    if (!warnMissing[blockData?.id]) {
      warnMissing[blockData?.id] = true;
      console.warn("Block data is missing texture information entirely:", blockData);
    }
    return FALLBACK_TEXTURE;
  }
  const candidates = [];
  for (const value of filtered) {
    if (value && typeof value === "string") {
      candidates.push(value);
      continue;
    }
    if (!value || (value instanceof Array && !value.length)) {
      continue;
    }
    if (value instanceof Array && value.length === 1 && value[0] && typeof value[0] === 'string') {
      candidates.push(value[0]);
      continue;
    }
    if (value instanceof Array && value.length === 2 && value[0] && value[1]) {
      candidates.push(value[sideNumber === 4 || sideNumber === 5 ? 0 : 1]);
      continue;
    }
    if (value instanceof Array && value.length === 3 && value[0] && value[1] && value[2]) {
      candidates.push(value[sideNumber < 4 ? 1 : sideNumber === 4 ? 0 : 2]);
      continue;
    }
    if (value instanceof Array && value.length === 6 && value[sideNumber]) {
      candidates.push(value[sideNumber]);
      continue;
    }
    if (!(value instanceof Array) && typeof value === 'object') {
      const sideName = getSideName(sideNumber);
      if (!value[sideName]) {
        console.warn(`Missing texture for side "${sideName}" on block with object texture`);
        if (blockData.id !== 10) {
          continue;
        }
      }
      if (value[sideName]) {
        candidates.push(value[sideName]);
      }
    }
    if (value instanceof Function) {
      const texture = value.call(blockData.data, sideNumber, x, y, z);
      if (!value.includes(texture)) {
        console.warn(`Texture list for side "${getSideName(sideNumber)}" (${sideNumber}) at ${x},${y},${z} returned a value out of the declared texture list options`);
      }
      if (value && typeof texture === 'string') {
        candidates.push(texture);
      } else {
        console.warn(`Texture list for side "${getSideName(sideNumber)}" (${sideNumber}) at ${x},${y},${z} returned`, texture);
      }
    }
  }
  const refiltered = candidates.filter(a => a && a !== FALLBACK_TEXTURE);
  if (refiltered.length === 0) {
    if (!warnMissing[blockData?.id]) {
      warnMissing[blockData?.id] = true;
      console.warn("Block data texture information is empty after processing:", blockData);
    }
    return;
  }
  return refiltered.find(Boolean);
}


export function getTextureListFromBlock(block) {
  if (block.textureList) {
    return block.textureList;
  }
  if (typeof block.texture === 'string') {
    return [block.texture];
  }
  if (typeof block.texture === 'object') {
    return [
      block.texture[getSideName(0)],
      block.texture[getSideName(1)],
      block.texture[getSideName(2)],
      block.texture[getSideName(3)],
      block.texture[getSideName(4)],
      block.texture[getSideName(5)],
    ];
  }
  console.warn("Texture list is empty and block is fully out of");
  return [];
}

g("getTextureFromBlock", getTextureFromBlock);
g("getTextureListFromBlock", getTextureListFromBlock);
