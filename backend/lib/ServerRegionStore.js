
import { appendStorageArray, clearStorageArray, clearStorageObject, loadStorageArray, loadStorageObject, writeStorageObject } from "./primitives/StorageObjectStore.js";

/**
 * @template T
 * @param {string} id
 * @param {T | undefined | null} fallback
 * @returns {Promise<T>}
 */
export async function loadServerRegionState(id = "", fallback = undefined) {
  return await loadStorageObject("region", id, null, fallback);
}

/**
 * @param {string} id
 * @returns {Promise<Array>}
 */
export async function loadServerRegionChanges(id = "") {
  return await loadStorageArray("region", id, null);
}

/**
 * @param {string} id
 * @param {any} state
 * @returns {Promise<number>} Total number of bytes written on file
 */
export async function writeServerRegionState(id = "", state = {}) {
  return await writeStorageObject("region", id, null, state);
}

/**
 * @param {string} id
 * @param {any | any[]} changes
 * @returns {Promise<number>} Total number of changes saved to file
 */
export async function appendServerRegionChanges(id = "", changes = []) {
  return await appendStorageArray("region", id, null, changes);
}

/**
 * @param {string} id
 * @returns {Promise<boolean>} Whether the file existed before the operation.
 */
export async function clearServerRegionState(id = "") {
  return await clearStorageObject("region", id, null);
}

/**
 * @param {string} id
 * @returns {Promise<boolean>} Whether the file existed before the operation.
 */
export async function clearServerRegionChanges(id = "") {
  return await clearStorageArray("region", id, null);
}
