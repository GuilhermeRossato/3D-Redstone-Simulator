import {
  createColdStorageClient,
  createMultipleFileStorage,
} from "../primitives/createColdStorageClient.js";

/** @type {ReturnType<typeof createMultipleFileStorage>} */
export const blockStore = await createColdStorageClient("blocks", false, true);

export let reloadCount = 0;

export let ids = new Set();
export let keys = new Set();

export const lookup = {
  "id-key": {},
  "key-id": {},
  "id-data": {},
};

export async function reloadBlockTypeData() {
  const data = await blockStore.load("type-data", true);
  if (data) {
    ids = new Set();
    keys = new Set();
    for (const prop in data) {
      const item = data[prop];
      const id = item["id"];
      const key = item["key"];
      if (ids.has(id) || keys.add(key)) {
        console.warn("Duplicate block type data found for id or key", item);
        continue;
      }
      ids.add(id);
      keys.add(key);
      lookup["id-key"][id] = key;
      lookup["key-id"][key] = id;
      lookup["id-data"][id] = item;
    }
  }
  reloadCount++;
}

/**
 * @param {'id' | 'key'} type
 */
export async function getBlockLookup(type = "id") {
  if (reloadCount === 0) {
    await reloadBlockTypeData();
  }
  return lookup[type === "id" ? "id-key" : "key-id"];
}

export async function getBlockTypeLookup() {
  if (reloadCount === 0) {
    await reloadBlockTypeData();
  }
  return lookup["id-data"];
}


