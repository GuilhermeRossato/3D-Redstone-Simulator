
import fs from 'fs';
import { getProjectFolderPath } from "../../utils/getProjectFolderPath.js";
import { getStorageObjectFilePath, loadStorageObject, writeStorageObject } from "../primitives/StorageObjectStore.js";
import { blockNamingRecord, getBlockNamingKey, loadBlockNameData } from "./BlockSharedStorage.js";

const metadataCache = {};

export function normalizeBlockIdentifier(id_or_key_or_obj) {
  if (!id_or_key_or_obj) {
    throw new Error('Block metadata identifier is required');
  }
  let id;
  let key;
  if (id_or_key_or_obj && typeof id_or_key_or_obj === 'object' && metadataCache[id_or_key_or_obj.key] === id_or_key_or_obj) {
    id = id_or_key_or_obj.id;
    key = id_or_key_or_obj.key;
    return { id, key };
  }
  let ident = typeof id_or_key_or_obj === 'string' || typeof id_or_key_or_obj === 'number' ? id_or_key_or_obj : typeof id_or_key_or_obj === 'object' ? (id_or_key_or_obj.key || id_or_key_or_obj.id) : null;
  if (ident && typeof ident === 'string' && ident.length && ident.split('').every(c => c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57)) {
    id = ident = parseInt(ident);
  } else if (ident && typeof ident === 'string' && ident.length) {
    key = ident = ident.trim().toUpperCase();
  }
  id_or_key_or_obj = blockNamingRecord.get(String(ident));
  if (!id_or_key_or_obj && !blockNamingRecord.size) {
    throw new Error('Block naming record is not loaded. Call loadBlockNameData() first.');
  }
  id = id_or_key_or_obj.id;
  key = id_or_key_or_obj.key;
  return { id, key };
}

export async function loadBlockMetadata(id_or_key_or_obj, resetCache = false) {
  const { id, key } = normalizeBlockIdentifier(id_or_key_or_obj);
  if (metadataCache[key] && !resetCache) {
    return metadataCache[key];
  }
  const name = key.replace(/\W/g, ' ').replace(/\s\s+/g, ' ').trim().replace(/\s/g, '_').toLowerCase();
  if (!name || name.length <= 2 || /^\d+$/.test(name) || !/^[a-z_]+$/.test(name)) {
    throw new Error(`Invalid block metadata identifier: ${JSON.stringify(name)}`);
  }
  let data = await loadStorageObject("blocks", name, null, null);
  if (!data) {
    if (!blockNamingRecord.size) {
      await loadBlockNameData(true);
    }
    const obj = blockNamingRecord.get(key) || blockNamingRecord.get(String(id));
    if (!obj) {
      console.log(`Block metadata for key "${key}" and id "${id}" not found in naming record.`);
      return null;
    }
    data = { id: obj.id, key: obj.key, textures: [] };
  }
  data.loaded = Math.floor(Date.now());
  const target = getStorageObjectFilePath("blocks", name, null, false);
  try {
    const stat = await fs.promises.stat(target);
    data.updated = Math.floor(stat.mtimeMs);
    data.fileSize = stat.size;
  } catch (err) {
    data.updated = Math.floor(Date.now());
  }
  if (data.type === 'block') {
    delete data.type;
  }
  metadataCache[key] = data;
  return metadataCache[key];
}

/**
 * Check if the str has an ending dot (an extension)
 * @param {any} str 
 */
function isStringPath(str) {
  return str && typeof str === 'string' && str.length > 5 && [4, 5].includes(str.length - str.lastIndexOf('.'));
}

export async function saveBlockMetadata(data) {
  if (!data.key || typeof data.key !== 'string') {
    throw new Error('Block metadata must have a "key" property');
  }
  if (/^\d+$/.test(data.key)) {
    throw new Error('Block metadata "key" property cannot contain only digits');
  }
  const name = data.key.replace(/\W/g, ' ').replace(/\s\s+/g, ' ').trim().replace(/\s/g, '_').toLowerCase();
  if (data.data) {
    throw new Error('Block metadata "data" property is reserved and cannot be used');
  }
  const existing = await loadStorageObject('blocks', data.key, null);
  if (!existing || typeof existing !== 'object') {
    throw new Error(`Block metadata with key "${data.key}" does not exist`);
  }
  if (data.id && !existing.id) {
    existing.id = data.id;
  }
  if (data.id && existing.id && data.id !== existing.id) {
    throw new Error(`Block metadata "id" property cannot be changed once set (existing: ${existing.id}, new: ${data.id})`);
  }
  if (data.key && !existing.key) {
    existing.key = data.key;
  }
  if (data.key && existing.key && data.key !== existing.key) {
    throw new Error(`Block metadata "key" property cannot be changed once set (existing: ${existing.id}, new: ${data.id})`);
  }
  console.log(`Saving block metadata for "${data.key}" (id: ${data.id})`);
  delete data.updated;
  delete data.loaded;
  data.saved = Math.floor(Date.now());
  const obj = {
    id: existing.id || data.id,
    key: existing.key || data.key,
    textures: data.textures || existing.textures || [],
    ...data,
  };
  await writeStorageObject("blocks", name, null, obj);
  return data;
}
