
import { appendStorageArray, loadStorageArray } from "../primitives/StorageObjectStore.js";

export let record = new Map();

let highestId=0;

export async function loadBlockTypeData() {
  const data = await loadStorageArray("block-types", null, null);
  if (!data || !Array.isArray(data)) {
    console.warn("No block type data found or invalid format");
    return;
  }
  record.clear();
  for (const item of data) {
    if (item.id && typeof item.id === 'number' && item.id > highestId) {
      highestId = item.id;
    }
    if (item.id && item.key) {
      if (record.has(item.id) || record.has(item.key)) {
        console.warn("Duplicate block type item found:", item);
      } else {
        record.set(item.id, item);
        record.set(item.key, item);
      }
    } else {
      console.warn("Invalid block type item:", item);
    }
  }
  return record;
}

export async function getBlockTypeDataFrom(id_or_key) {
  if (record.size === 0) {
    await loadBlockTypeData();
  }
  if (typeof id_or_key === 'string' && id_or_key.length && /^\d+$/.test(id_or_key)) {
    id_or_key = parseInt(id_or_key, 10);
  }
  return record.get(id_or_key) || null;
}

export async function getBlockTypeId(key) {
  if (typeof key !== 'string' || !key.length) {
    throw new Error('Block type key must be a non-empty string.');
  }
  if (/^\d+$/.test(key)) {
    return parseInt(key);
  }
  if (record.size === 0) {
    await loadBlockTypeData();
  }
  const item = record.get(key);
  if (item) {
    return item.id;
  }
  return null;
}

export async function saveBlockTypeData(data) {
  if (!data.key || typeof data.key !== 'string') {
    throw new Error('Block type data must have a "key" property');
  }
  if (/^\d+$/.test(data.key)) {
    throw new Error('Block type "key" property cannot contain only digits.');
  }
  if (record.size === 0) {
    await loadBlockTypeData();
  }
  if (!data.id) {
    data.id = record.get(data.key)?.id;
  }
  if (data.id) {
    if (typeof data.id === 'string' && data.id.length && /^\d+$/.test(data.id)) {
      data.id = parseInt(data.id, 10);
    }
    if (typeof data.id !== 'number' || data.id <= 0 || Math.floor(data.id) !== data.id) {
      throw new Error('Block type data must have "id" integer property.');
    }
    if (!record.has(data.id)) {
      throw new Error(`Block type with id "${data.id}" does not exist.`);
    }
    if (record.get(data.id).key !== data.key) {
      throw new Error(`Block type with id "${data.id}" has mismatching key: ${JSON.stringify(data.key)} !== ${JSON.stringify(record.get(data.id).key)}.`);
    }
    const list = await loadStorageArray("block-types", null, null);
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
    await appendStorageArray("block-types", null, null, [changed]);
    
    return data;
  }
  if (record.has(data.key)) {
    throw new Error(`Block type with key "${data.key}" already exists.`);
  }
  console.log('Creating new block type:', data.key);
  data.id = highestId + 1;
  if (record.has(data.id)) {
    console.log(`Warning: Block type with id "${data.id}" caused a conflict.`);
    data.id++;
    if (record.has(data.id)) {
      data.id = (Object.keys(record).length/2) + 1;
    }
    if (record.has(data.id)) {
      data.id++;
    }
    if (record.has(data.id)) {
      throw new Error(`Block type with id "${data.id}" caused a conflict.`);
    }
  }
  record.set(data.id, data);
  record.set(data.key, data);
  highestId = Math.max(highestId, data.id);
  data.created = Date.now();
  await appendStorageArray("block-types", null, null, [data]);
  return data;
}
