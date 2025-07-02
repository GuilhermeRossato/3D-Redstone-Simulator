import fs from "fs";
import path from "path";

const backendPath = './backend';

/** @type {Record<string, number>} */
const countRecord = {};

/** @type {Record<string, number>} */
const confirmRecord = {};

function getStorageObjectFilePath(type, name, id, isArray = false) {
  return `${backendPath}/data/${[type, name, id]
    .filter((p) => (typeof p === "string" && p.length) || typeof p === "number")
    .join("/")}.json${isArray ? "l" : ""}`;
}

async function confirmPath(target) {
  target = path.dirname(target);
  if (!confirmRecord[target]) {
    confirmRecord[target] = Date.now();
    try {
      await fs.promises.stat(target);
    } catch (err) {
      await fs.promises.mkdir(target, { recursive: true });
    }
  }
}

/**
 * @template T
 * @param {string} type
 * @param {string} [name]
 * @param {string} [id]
 * @param {T | undefined | null} fallback
 * @returns {Promise<T>}
 */
export async function loadStorageObject(type, name, id, fallback = undefined) {
  try {
    const buffer = await fs.promises.readFile(
      getStorageObjectFilePath(type, name, id, false)
    );
    const text = buffer.toString("utf-8");
    const obj = JSON.parse(text || "{}");
    if (fallback) {
      for (const key in fallback) {
        if (obj[key] === undefined) {
          obj[key] = fallback[key];
        }
      }
    }
    if (typeof fallback?.["fileSize"] === "number") {
      obj.fileSize = buffer.byteLength;
    }
    return obj;
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
    return fallback;
  }
}

/**
 * @template T
 * @param {string} type
 * @param {string} [name]
 * @param {string} [id]
 * @param {T | undefined | null} fallback
 * @returns {Promise<T[]>}
 */
export async function loadStorageArray(type, name, id, fallback = undefined) {
  try {
    const text = await fs.promises.readFile(
      getStorageObjectFilePath(type, name, id, true),
      "utf-8"
    );
    const list = JSON.parse(`[${text.substring(0, text.lastIndexOf(","))}]`);
    countRecord[id] = list.length;
    return list;
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
    return [fallback].slice(0, 0);
  }
}

/**
 * @param {string} type
 * @param {string} [name]
 * @param {string} [id]
 * @param {any} state
 * @returns {Promise<number>} Total number of bytes written on file
 */
export async function writeStorageObject(type, name, id, state = {}) {
  try {
    const text = JSON.stringify(state, null, "  ");
    const buffer = Buffer.from(text, "utf-8");
    const target = getStorageObjectFilePath(type, name, id, false);
    await confirmPath(target);
    await fs.promises.writeFile(target, buffer, "utf-8");
    return buffer.byteLength;
  } catch (err) {
    throw err;
  }
}

/**
 * @param {string} type
 * @param {string} [name]
 * @param {string} [id]
 * @param {any | any[]} array
 * @returns {Promise<number>} Total length of the file contents
 */
export async function appendStorageArray(type, name, id, array = []) {
  try {
    if ((array instanceof Array && array.length === 0) || !array) {
      return countRecord[id] || 0;
    }
    const text = (array instanceof Array ? array : [array])
      .map((e) => `${JSON.stringify(e)},`)
      .join("\n");
    const target = getStorageObjectFilePath(type, name, id, true);
    await confirmPath(target);
    await fs.promises.appendFile(target, `${text}\n`, "utf-8");
    return (countRecord[id] =
      (countRecord[id] || 0) + (array instanceof Array ? array.length : 1));
  } catch (err) {
    throw err;
  }
}

/**
 * @param {string} type
 * @param {string} [name]
 * @param {string} [id]
 * @param {any[]} array
 * @returns {Promise<number>} Total number of changes on file
 */
export async function writeStorageArray(type, name, id, array = []) {
  try {
    if (!(array instanceof Array)) {
      throw new TypeError("Expected array");
    }
    const text = array.map((e) => `${JSON.stringify(e)},`).join("\n");
    const target = getStorageObjectFilePath(type, name, id, true);
    await confirmPath(target);
    await fs.promises.writeFile(target, text ? `${text}\n` : "", "utf-8");
    return (countRecord[id] = array.length);
  } catch (err) {
    throw err;
  }
}

/**
 * @param {string} type
 * @param {string} [name]
 * @param {string} [id]
 * @returns {Promise<boolean>} Whether the file existed before the operation.
 */
export async function clearStorageObject(type, name, id) {
  try {
    await fs.promises.unlink(getStorageObjectFilePath(type, name, id, false));
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

/**
 * @param {string} type
 * @param {string} [name]
 * @param {string} [id]
 * @returns {Promise<boolean>} Whether the file existed before the operation.
 */
export async function clearStorageArray(type, name, id) {
  try {
    await fs.promises.unlink(getStorageObjectFilePath(type, name, id, true));
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}
