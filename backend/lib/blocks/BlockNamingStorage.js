
import { appendStorageArray, loadStorageArray } from "../primitives/StorageObjectStore.js";

/** @type {{id: number, key: string; created: number, data?: any}[]} */
export let blockNamingList = [];
export let blockNamingRecord = new Map();

let highestId=0;

export async function loadBlockNamingData() {
  const data = await loadStorageArray("blocks", "ids", null);
  if (!data || !Array.isArray(data)) {
    console.warn("No block type data found or invalid format");
    return;
  }
  blockNamingList = data;
  blockNamingRecord.clear();
  for (const item of blockNamingList) {
    if (item.id && typeof item.id === 'number' && item.id > highestId) {
      highestId = item.id;
    }
    if (item.id && item.key) {
      if (blockNamingRecord.has(item.id) || blockNamingRecord.has(item.key)) {
        console.warn("Duplicate block type item found:", item);
      } else {
        blockNamingRecord.set(item.id, item);
        blockNamingRecord.set(item.key, item);
      }
    } else {
      console.warn("Invalid block type item:", item);
    }
  }
  return blockNamingRecord;
}

export async function getBlockNamingKeyDataFrom(id_or_key) {
  if (blockNamingRecord.size === 0) {
    await loadBlockNamingData();
  }
  if (typeof id_or_key === 'string' && id_or_key.length && /^\d+$/.test(id_or_key)) {
    id_or_key = parseInt(id_or_key, 10);
  }
  return blockNamingRecord.get(id_or_key) || null;
}

export async function getBlockNamingId(key) {
  if (typeof key !== 'string' || !key.length) {
    throw new Error('Block type key must be a non-empty string.');
  }
  if (/^\d+$/.test(key)) {
    return parseInt(key);
  }
  if (blockNamingRecord.size === 0) {
    await loadBlockNamingData();
  }
  const item = blockNamingRecord.get(key);
  if (item) {
    return item.id;
  }
  return null;
}

export async function getBlockNamingKey(id) {
  if (typeof id !== 'number' || id <= 0 || Math.floor(id) !== id) {
    throw new Error('Block type id must be a positive integer.');
  }
  if (blockNamingRecord.size === 0) {
    await loadBlockNamingData();
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
    await loadBlockNamingData();
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
    const state = {id: data.id, key: data.key};
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.id && typeof item.id === 'number' && item.id > highestId) {
        highestId = item.id;
      }
      if (item.id === data.id || item.key === data.key) {
        for (const key in state) {
          if (!data.hasOwnProperty(key)||['key', 'id', 'updated', 'created'].includes(key)||key.startsWith('_')) {
            continue;
          }
          state[key] = data[key];
        }
      }
    }
    const changed = {id: data.id, key: data.key};
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
      data.id = (Object.keys(blockNamingRecord).length/2) + 1;
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
