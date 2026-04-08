
import { appendStorageArray, clearStorageArray, clearStorageObject, loadStorageArray, loadStorageObject, writeStorageObject } from "./primitives/StorageObjectStore.js";

/**
 * @template T
 * @param {string} id
 * @param {T | undefined | null} fallback
 * @returns {Promise<T>}
 */
export async function loadServerRegionState(id = "", fallback = undefined) {
  const obj = await loadStorageObject("region", id, null, fallback);
  for (const key of ["players", "entities"]) {
    if (!obj[key] || typeof obj[key] !== "object" || Array.isArray(obj[key])) {
      obj[key] = {};
    }
  }
  /** @type {any} */
  let any = obj;
  if (any.id && any.id !== id) {
    throw new Error(`Region id mismatch, file id ${JSON.stringify(any.id)} vs requested id ${JSON.stringify(id)}`);
  }
  delete any.rx;
  delete any.ry;
  delete any.rz;
  return obj;
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
 * @param {any} obj
 * @returns {Promise<number>} Total number of bytes written on file
 */
export async function writeServerRegionState(id = "", obj = {}) {
  for (const key of ["players", "entities"]) {
    if (!obj[key] || typeof obj[key] !== "object" || Array.isArray(obj[key])) {
      obj[key] = {};
    }
  }
  return await writeStorageObject("region", id, null, obj);
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
