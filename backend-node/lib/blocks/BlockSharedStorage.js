
import fs from 'fs';
import { getProjectFolderPath } from "../../utils/getProjectFolderPath.js";
import { appendStorageArray, getStorageObjectFilePath, loadStorageArray } from "../primitives/StorageObjectStore.js";
import { loadBlockMetadata } from './BlockMetadataStorage.js';

/** @type {{id: number, key: string; loaded: number, created: number, data?: any, textures?: string[]}[]} */
export let blockNamingList = [];
export const blockNamingRecord = new Map();

let highestId = 0;

/**
 * Finds paths on a object recursively and add to a Set.
 * @param {any} node 
 * @param {Set<string>} pathSet 
 * @param {number} maxDepth 
 */
function recursivelySearchForTexture(node, pathSet = new Set(), maxDepth = 3) {
  if (node && typeof node === 'string' && /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(node.trim())) {
    pathSet.add(node);
    return pathSet;
  }
  if (!node || maxDepth < 0) {
    return pathSet;
  }
  if (typeof node === 'object') {
    for (const key in node) {
      recursivelySearchForTexture(node[key], pathSet, maxDepth - 1)
    }
  }
  return pathSet;
}

/**
    * Asynchronously attempts to execute a promise and returns the result.
    * If an error is thrown with a code of 'ENOENT', null is returned instead.
    * @template ResponseType
    * @param {Promise<ResponseType>} promise
    * @returns {Promise<ResponseType | null | Error>}
    */
async function asyncTryCatchNull(promise) {
  try {
    return await promise;
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return null;
    }
    return err;
  }
}

async function initializeTextures(obj, resetCache = false) {
  const name = obj.key.replace(/\W/g, ' ').replace(/\s\s+/g, ' ').trim().replace(/\s/g, '_').toLowerCase();
  if (!name || name.length <= 2 || /^\d+$/.test(name) || !/^[a-z_]+$/.test(name)) {
    throw new Error(`Invalid block metadata identifier: ${JSON.stringify(name)}`);
  }
  if (resetCache || obj.textures === null || obj.textures === undefined) {
    obj.textures = [];
  }
  if (!(obj.textures instanceof Array)) {
    console.warn(`Block shared object "textures" property must be an array if defined: ${JSON.stringify(obj)}`);
    obj.textures = typeof obj.textures === 'string' ? [obj.textures] : [];
  }
  if (!obj.textures.length) {
    let arr = recursivelySearchForTexture(obj);
    if (!arr || !arr.size) {
      arr = new Set();
      const possibilities = [`${name.replace(/\_/g, '-')}.png`, `${name.replace(/\-/g, '_')}.png`].flatMap(name => [['backend', 'data', 'images', name], ['frontend', 'assets', 'textures', name]]);
      for (const parts of possibilities) {
        const possiblePath = getProjectFolderPath(...parts);
        const stat = await asyncTryCatchNull(fs.promises.stat(possiblePath));
        if (stat?.["size"]) {
          arr.add(parts[parts.length - 1]);
        }
      }
    }
    obj.textures = Array.from(arr ? arr : []);
  }
  return obj;
}
let lastTextureWriteTime = 0;
export async function getBlockDefinitions(resetCache = false) {
  const startedEmpty = blockNamingList.length === 0;
  if (startedEmpty) {
    await loadBlockNameData();
  }
  const blocks = {};
  let now = Math.floor(Date.now());
  for (const obj of blockNamingList) {
    if (!obj) continue;
    if (!obj.key) throw new Error(`Block type item is missing key: ${JSON.stringify(obj)}`);
    if (!obj.data || !obj.data.loaded || Math.abs(now - obj.data.loaded) > 60_000) {
      obj.data = await loadBlockMetadata(obj.key, true);
      if (!obj.data) throw new Error(`Block type item is missing metadata: ${JSON.stringify(obj)}`);
      delete obj.data.id;
      delete obj.data.key;
      obj.data.loaded = now;
    }
    blocks[obj.id] = await initializeTextures(obj, resetCache);
  }
  if (!blocks || Object.keys(blocks).length === 0) {
    throw new Error("No block definitions found or loaded.");
  }
  now = Math.floor(Date.now());
  if (Math.abs(now - lastTextureWriteTime) > 60_000) {
    lastTextureWriteTime = now;
    {
      const target = getProjectFolderPath('frontend', 'assets', 'blocks', 'textures.jsonl');
      // console.log(`Writing block textures to ${JSON.stringify(target.substring(process.cwd().length))}`);
      const entries = Object.values(blocks).map(b => ({ id: b.id, key: b.key, textures: b.textures }));
      // @ts-ignore
      entries.unshift({ file: "textures.jsonl", date: new Date().toISOString(), generator: "backend/lib/blocks/BlockSharedStorage.js", })
      fs.writeFileSync(target, JSON.stringify(entries).replace(/^\[|\]$/g, '').split('},').join('},\n') + '\n', 'utf-8');
    }
    {
      const target = getProjectFolderPath('frontend', 'assets', 'blocks', 'ids.jsonl');
      // console.log(`Writing id data to ${JSON.stringify(target.substring(process.cwd().length))}`);
      const entries = Object.values(blocks).map(b => ({ id: b.id, key: b.key }));
      // @ts-ignore
      entries.unshift({ file: "ids.jsonl", date: new Date().toISOString(), generator: "backend/lib/blocks/BlockSharedStorage.js", })
      fs.writeFileSync(target, JSON.stringify(entries).replace(/^\[|\]$/g, '').split('},').join('},\n') + '\n', 'utf-8');
    }
  }
  return blocks;
}

export async function loadBlockNameData(resetCache = false) {
  if (blockNamingList.length > 0 && !resetCache) {
    return blockNamingRecord;
  }
  const list = await loadStorageArray("blocks", "ids", null);
  blockNamingList = [];
  blockNamingRecord.clear();
  const now = Math.floor(Date.now());
  for (const item of list) {
    if (!item.id || typeof item.id !== 'number' || isNaN(item.id)) {
      throw new Error(`Block type item has invalid id: ${JSON.stringify(item)}`);
    }
    if (!item.key || typeof item.key !== 'string' || !item.key.length || /^\d+$/.test(item.key) || (item.key.charCodeAt(0) >= 48 && item.key.charCodeAt(0) <= 57)) {
      throw new Error(`Block type item has invalid key: ${JSON.stringify(item)}`);
    }
    if (blockNamingRecord.has(String(item.id))) {
      throw new Error(`Duplicate block type item found by id ${JSON.stringify(String(item.id))}. Original: ${JSON.stringify(blockNamingRecord.get(String(item.id)))}, Duplicate: ${JSON.stringify(item)}`);
    }
    if (blockNamingRecord.has(String(item.key))) {
      throw new Error(`Duplicate block type item found by key ${JSON.stringify(String(item.key))}. Original: ${JSON.stringify(blockNamingRecord.get(String(item.key)))}, Duplicate: ${JSON.stringify(item)}`);
    }
    if (item.data || item.textures) {
      console.warn(`Block id type item cannot have "data" or "textures" property pre-defined: ${JSON.stringify(item)}`);
    }
    const obj = {
      id: item.id,
      key: item.key,
      created: item.created,
      loaded: now,
      data: {},
      textures: [],
    }
    blockNamingList.push(obj);
    blockNamingRecord.set(String(obj.id), obj);
    blockNamingRecord.set(String(obj.key), obj);
  }
  blockNamingList = blockNamingList.sort((a, b) => a.id - b.id);
  return blockNamingRecord;
}

export async function getBlockNamingId(key) {
  if (typeof key !== 'string' || !key.length) {
    throw new Error('Block type key must be a non-empty string.');
  }
  if (/^\d+$/.test(key)) {
    return parseInt(key);
  }
  if (blockNamingRecord.size === 0) {
    await loadBlockNameData();
  }
  const item = blockNamingRecord.get(key);
  if (item) {
    return item.id;
  }
  return null;
}

export async function getBlockNamingKey(id) {
  if (typeof id !== 'number' || id <= 0 || Math.floor(id) !== id || isNaN(id)) {
    throw new Error('Block type id must be a positive integer.');
  }
  if (blockNamingRecord.size === 0) {
    await loadBlockNameData();
  }
  const item = blockNamingRecord.get(id);
  if (item) {
    return item.key;
  }
  return null;
}

export async function registerBlockNamingData(data) {
  if (!data.key || typeof data.key !== 'string') {
    throw new Error('Block type data must have a "key" property');
  }
  if (/^\d+$/.test(data.key)) {
    throw new Error('Block type "key" property cannot contain only digits.');
  }
  if (blockNamingRecord.size === 0) {
    await loadBlockNameData();
  }
  if (!data.id) {
    data.id = blockNamingRecord.get(data.key)?.id;
  }
  if (data.id) {
    if (typeof data.id === 'string' && data.id.length && /^\d+$/.test(data.id)) {
      data.id = parseInt(data.id, 10);
    }
    if (typeof data.id !== 'number' || data.id <= 0 || Math.floor(data.id) !== data.id) {
      throw new Error('Block type data must have "id" integer property.');
    }
    if (!blockNamingRecord.has(data.id)) {
      throw new Error(`Block type with id "${data.id}" does not exist.`);
    }
    if (blockNamingRecord.get(data.id).key !== data.key) {
      throw new Error(`Block type with id "${data.id}" has mismatching key: ${JSON.stringify(data.key)} !== ${JSON.stringify(blockNamingRecord.get(data.id).key)}.`);
    }
    const list = await loadStorageArray("blocks", "ids", null);
    const state = { id: data.id, key: data.key };
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.id && typeof item.id === 'number' && item.id > highestId) {
        highestId = item.id;
      }
      if (item.id === data.id || item.key === data.key) {
        for (const key in state) {
          if (!data.hasOwnProperty(key) || ['key', 'id', 'updated', 'created'].includes(key) || key.startsWith('_')) {
            continue;
          }
          state[key] = data[key];
        }
      }
    }
    const changed = { id: data.id, key: data.key };
    for (const key in data) {
      if (!state[key] || typeof state[key] !== typeof data[key] || JSON.stringify(state[key]) !== JSON.stringify(data[key])) {
        changed[key] = data[key];
      }
    }
    if (Object.keys(changed).length <= 2) {
      return changed;
    }
    await appendStorageArray("blocks", "ids", null, [changed]);
    return data;
  }
  if (blockNamingRecord.has(data.key)) {
    throw new Error(`Block type with key "${data.key}" already exists.`);
  }
  console.log('Creating new block type:', data.key);
  data.id = highestId + 1;
  if (blockNamingRecord.has(data.id)) {
    console.log(`Warning: Block type with id "${data.id}" caused a conflict.`);
    data.id++;
    if (blockNamingRecord.has(data.id)) {
      data.id = (Object.keys(blockNamingRecord).length / 2) + 1;
    }
    if (blockNamingRecord.has(data.id)) {
      data.id++;
    }
    if (blockNamingRecord.has(data.id)) {
      throw new Error(`Block type with id "${data.id}" caused a conflict.`);
    }
  }
  blockNamingRecord.set(data.id, data);
  blockNamingRecord.set(data.key, data);
  highestId = Math.max(highestId, data.id);
  data.created = Date.now();
  await appendStorageArray("blocks", "ids", null, [data]);
  return data;
}
