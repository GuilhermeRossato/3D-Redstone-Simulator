
import { appendStorageArray, clearStorageArray, clearStorageObject, loadStorageArray, loadStorageObject, writeStorageObject } from "./primitives/StorageObjectStore.js";

/**
 * @template T
 * @param {string} id
 * @param {T | undefined | null} fallback
 * @returns {Promise<T&{id: string}>}
 */
export async function loadServerChunkState(id = "", fallback = undefined) {
  /** @type {any} */
  const record = await loadStorageObject("chunks", id, null, fallback);
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
  return await loadStorageArray("chunks", id, null);
}

/**
 * @param {string} id
 * @param {any} state
 * @returns {Promise<number>} Total number of bytes written on file
 */
export async function writeServerChunkState(id = "", state = {}) {
  return await writeStorageObject("chunks", id, null, state);
}

/**
 * @param {string} id
 * @param {any | any[]} changes
 * @returns {Promise<number>} Total number of changes saved to file
 */
export async function appendServerChunkChanges(id = "", changes = []) {
  return await appendStorageArray("chunks", id, null, changes);
}

/**
 * @param {string} id
 * @returns {Promise<boolean>} Whether the file existed before the operation.
 */
export async function clearServerChunkState(id = "") {
  return await clearStorageObject("chunks", id, null);
}

/**
 * @param {string} id
 * @returns {Promise<boolean>} Whether the file existed before the operation.
 */
export async function clearServerChunkChanges(id = "") {
  return await clearStorageArray("chunks", id, null);
}
