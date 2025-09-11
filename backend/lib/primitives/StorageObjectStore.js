import fs from "fs";
import path from "path";
import { getProjectFolderPath } from "../../utils/getProjectFolderPath.js";
import { BlockList } from "net";

const dataFolderPath = getProjectFolderPath('backend', 'data');

/** @type {Record<string, number>} */
const countRecord = {};

/** @type {Record<string, number>} */
const confirmRecord = {};

export function getStorageObjectFilePath(type, name, id, isArray = false) {
  return `${dataFolderPath}/${[type, name, id]
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
    const filePath = getStorageObjectFilePath(type, name, id, false);
    // console.log({type, filePath});
    const buffer = await fs.promises.readFile(
      filePath
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
    if (id || name) {
      countRecord[id || name] = list.length;
    }
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
    console.log({type, filePath: target, state});
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
      return countRecord[id || name] || 0;
    }
    const list = (array instanceof Array ? array : [array]);
    const text = list
      .map((e) => `${JSON.stringify(e)},`)
      .join("\n");
    const target = getStorageObjectFilePath(type, name, id, true);
    await confirmPath(target);
    try {
      await fs.promises.appendFile(target, `${text}\n`, "utf-8");
    } catch (err) {
      if (err.code === "ENOENT") {
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        await fs.promises.writeFile(target, `${text}\n`, "utf-8");
      } else {
        throw err;
      }
    }
    if (id || name) {
      if (!countRecord[id || name]) {
        const text = await fs.promises.readFile(target, 'utf-8');
        countRecord[id || name] = text.split('\n').filter(a => a.trim().length > 1).length
      }
      return (countRecord[id || name] = (countRecord[id || name] || 0) + list.length);
    }
    return list.length;
  } catch (err) {
    throw err;
  }
}

/**
 * @param {string} type
 * @param {string} [name]
 * @param {string} [id]
 * @param {any[]} list
 * @returns {Promise<number>} Total number of changes on file
 */
export async function writeStorageArray(type, name, id, list = []) {
  try {
    if (!(list instanceof Array)) {
      throw new TypeError("Expected array");
    }
    const text = list.map((e) => `${JSON.stringify(e)},`).join("\n");
    const target = getStorageObjectFilePath(type, name, id, true);
    await confirmPath(target);
    await fs.promises.writeFile(target, text ? `${text}\n` : "", "utf-8");
    if (id || name) {
      countRecord[id || name] = list.length;
    }
    return list.length;
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
    if (id || name) {
      countRecord[id || name] = 0;
    }
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}
