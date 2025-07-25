
import fs from 'fs';
import { getProjectFolderPath } from "../../utils/getProjectFolderPath.js";
import { loadStorageArray, loadStorageObject, writeStorageObject } from "../primitives/StorageObjectStore.js";
import { getBlockNamingKey } from "./BlockNamingStorage.js";

let imageList = [];

const cache = {};

const textureAssetPath = getProjectFolderPath('frontend', 'assets', 'textures');

export async function loadBlockMetadata(key, resetCache = false) {
  if (!key) {
    throw new Error('Block metadata key is required.');
  }
  if (key && ((typeof key === 'string' && /^\d+$/.test(key)) || (typeof key === 'number' && key > 0))) {
    key = await getBlockNamingKey(key);
  }
  if (!key || typeof key !== 'string' || /^\d+$/.test(key)) {
    throw new Error('Block metadata "key" property is invalid.');
  }

  const name = key.replace(/\W/g, ' ').replace(/\s\s+/g, ' ').trim().replace(/\s/g, '_').toLowerCase();

  if (cache[name] && !resetCache) {
    return cache[name];
  }

  let data = await loadStorageObject("blocks", name, null);
  if (data) {
    data.loaded = Date.now();
    cache[name] = data;
    return cache[name];
  }

  try {
    if (!imageList || !imageList.includes(name + '.png')) {
      imageList = await fs.promises.readdir(textureAssetPath);
    }
    if (imageList.includes(name + '.png')) {
      cache[name] = {
        key,
        texture: `${name}.png`,
        loaded: Date.now(),
      };
      return cache[name];
    }
  } catch (error) {
    console.log(`Error loading block metadata: ${error.message}`);
  }

  return null;
}

export async function saveBlockMetadata(data) {
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