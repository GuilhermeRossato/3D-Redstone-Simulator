

import { loadStorageArray, loadStorageObject, writeStorageObject } from "../primitives/StorageObjectStore.js";
import { record } from "./BlockTypeStorage.js";

const cache = {};

export async function loadBlockTypeMetadata(key, resetCache = false) {
  if (key && ((typeof key === 'string' && /^\d+$/.test(key))|| (typeof key === 'number' && key > 0))) {
    if (!record.size) {
      await loadStorageArray("block-types", null, null);
    }
    key = record.get(key)?.key;
  }
  if (!key||typeof key !== 'string'||/^\d+$/.test(key)) {
    throw new Error('Block metadata "key" property is invalid.');
  }
  const name = key.replace(/\W/g, ' ').replace(/\s\s+/g, ' ').trim().replace(/\s/g, '-').toLowerCase();
  if (!cache[name] || resetCache) {
    const data = await loadStorageObject("block-metadatas", name, null);
    data.save = saveBlockTypeMetadata.bind(null, data);
    cache[name] = data;
  }
  return cache[name];
}

export async function saveBlockTypeMetadata(data) {
  if (!data.key || typeof data.key !== 'string') {
    throw new Error('Block metadata must have a "key" property');
  }
  if (/^\d+$/.test(data.key)) {
    throw new Error('Block metadata "key" property cannot contain only digits.');
  }
  const name = data.key.replace(/\W/g, ' ').replace(/\s\s+/g, ' ').trim().replace(/\s/g, '-').toLowerCase();
  await writeStorageObject("block-metadatas", name, null, data)
  cache[name] = data;
  return data;
}