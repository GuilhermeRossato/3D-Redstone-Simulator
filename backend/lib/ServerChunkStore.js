
import { convertBlockListToBlockRecord } from "./convertBlockListToBlockRecord.js";
import { appendStorageArray, clearStorageArray, clearStorageObject, loadStorageArray, loadStorageObject, writeStorageObject } from "./primitives/StorageObjectStore.js";


/**
 * @template T
 * @param {string} id
 * @param {T | undefined | null} fallback
 * @returns {Promise<T&{id: string}>}
 */
export async function loadServerChunkState(id = "", fallback = undefined) {
  if (!id.startsWith('c')) {
    throw new Error(`Invalid chunk id, must start with "c", got ${JSON.stringify(id)}`);
  }
  /** @type {any} */
  const record = await loadStorageObject("chunks", id, null, fallback);
  if (!record.blocks||Object.keys(record.blocks).length===0&&(record.blockList && (typeof record.blockList === "string" || (typeof record.blockList === "object" && Array.isArray(record.blockList))))) {
    record.blocks = convertBlockListToBlockRecord(record.blockList);
  }
  // @ts-ignore
  record.id = id;
  if (record.entities||record.inside) {
    delete record.entities;
    delete record.inside;
    await writeServerChunkState(id, record);
  }
  return record;
}

/**
 * @param {string} id
 * @returns {Promise<Array>}
 */
export async function loadServerChunkChanges(id = "") {
  if (!id.startsWith('c')) {
    throw new Error(`Invalid chunk id, must start with "c", got ${JSON.stringify(id)}`);
  }
  return await loadStorageArray("chunks", id, null);
}

/**
 * @param {string} id
 * @param {any} state
 * @returns {Promise<number>} Total number of bytes written on file
 */
export async function writeServerChunkState(id = "", state = {}) {
  if (!id.startsWith('c')) {
    throw new Error(`Invalid chunk id, must start with "c", got ${JSON.stringify(id)}`);
  }
  return await writeStorageObject("chunks", id, null, state);
}

/**
 * @param {string} id
 * @param {any | any[]} changes
 * @returns {Promise<number>} Total number of changes saved to file
 */
export async function appendServerChunkChanges(id = "", changes = []) {
  if (!id.startsWith('c')) {
    throw new Error(`Invalid chunk id, must start with "c", got ${JSON.stringify(id)}`);
  }
  return await appendStorageArray("chunks", id, null, changes);
}

/**
 * @param {string} id
 * @returns {Promise<boolean>} Whether the file existed before the operation.
 */
export async function clearServerChunkState(id = "") {
  if (!id.startsWith('c')) {
    throw new Error(`Invalid chunk id, must start with "c", got ${JSON.stringify(id)}`);
  }
  return await clearStorageObject("chunks", id, null);
}

/**
 * @param {string} id
 * @returns {Promise<boolean>} Whether the file existed before the operation.
 */
export async function clearServerChunkChanges(id = "") {
  if (!id.startsWith('c')) {
    throw new Error(`Invalid chunk id, must start with "c", got ${JSON.stringify(id)}`);
  }
  return await clearStorageArray("chunks", id, null);
}
