// sfs: fs safety wrapper

import fs from "node:fs";

const isYes = () => true;
const isNo = () => false;

let lastPath = "";
let lastOp = null;
let lastRes = null;

const updatePathOpRes = (path, op, res, alt = undefined) => {
  lastPath = path;
  lastOp = op;
  lastRes = res;
  return alt === undefined ? res : res instanceof Error ? alt : res;
};

export function getLastPath() {
  return lastRes;
}

export function getLastOp() {
  return lastOp;
}

export function getLastRes() {
  return lastRes;
}

export function wasLastError() {
  return lastRes instanceof Error;
}

export function getLast() {
  return { path: lastPath, op: lastOp, res: lastRes };
}

/**
 * @param {Parameters<typeof fs.promises.readFile>[0]} path
 * @param {Parameters<typeof fs.promises.readFile>[1] | 'buffer' | ''} encoding
 * @returns {Promise<Buffer | string>} Whether or not the file was appended sucessfully
 */
const readFileFunc = async (path, encoding) => {
  try {
    const result = await fs.promises.readFile(
      path,
      encoding === "buffer" || encoding === "" ? "binary" : encoding
    );
    updatePathOpRes(path, "readFile", result);
    return result;
  } catch (error) {
    updatePathOpRes(path, "readFile", error);
    return !encoding || encoding === "binary" || encoding === "buffer"
      ? Buffer.from("")
      : "";
  }
};

/**
 * @param {Parameters<typeof fs.promises.readFile>[0]} path
 * @returns {Promise<string>} The file contents or a empty string in case of error.
 */
const readTextFileFunc = async (path = "") => {
  try {
    const result = await fs.promises.readFile(path, "utf-8");
    updatePathOpRes(path, "readFile", result);
    return result;
  } catch (error) {
    updatePathOpRes(path, "readFile", error);
    return "";
  }
};

/**
 * @param {Parameters<typeof fs.promises.writeFile>[0]} path
 * @param {any} data
 * @param {Parameters<typeof fs.promises.writeFile>[2]} [encoding]
 * @returns {ReturnType<statFunc>} Whether or not the file was appended sucessfully
 */
const writeFileFunc = async (path, data, encoding) => {
  try {
    const result = await fs.promises.writeFile(
      path,
      data && typeof data === "object" && !(data instanceof Buffer)
        ? JSON.stringify(data)
        : data,
      encoding
    );
    updatePathOpRes(path, "writeFile", result);
    return await statFunc(path);
  } catch (error) {
    updatePathOpRes(path, "writeFile", error);
    return null;
  }
};

/**
 * @param {Parameters<typeof fs.promises.appendFile>[0]} path
 * @param {any} data
 * @param {Parameters<typeof fs.promises.appendFile>[2]} [encoding]
 * @returns {Promise<boolean>} Whether or not the file was appended sucessfully
 */
const appendFileFunc = async (path, data, encoding) => {
  const text =
    data && typeof data === "object" && !(data instanceof Buffer)
      ? JSON.stringify(data)
      : data;
  try {
    const result = await fs.promises.appendFile(path, text, encoding);
    updatePathOpRes(path, "appendFile", result);
    return true;
  } catch (error) {
    if (error.code === "ENOENT" && typeof path === "string") {
      const parts = path.replace(/\\/g, "/").split("/");
      parts.pop();
      if (!fs.existsSync(parts.join("/"))) {
        await fs.promises.mkdir(parts.join("/"), { recursive: true });
        try {
          const result = await fs.promises.appendFile(path, text, encoding);
          updatePathOpRes(path, "appendFile", result);
          return true;
        } catch (error2) {
          updatePathOpRes(path, "appendFile", error2);
          return false;
        }
      }
    }
    updatePathOpRes(path, "appendFile", error);
    return false;
  }
};

/**
 * @param {Parameters<typeof fs.promises.unlink>[0]} path
 * @returns {Promise<boolean>} Whether or not the file was removed
 */
const unlinkFunc = async (path) => {
  try {
    const result = await fs.promises.unlink(path);
    updatePathOpRes(path, "unlink", result);
    return true;
  } catch (error) {
    updatePathOpRes(path, "unlink", error);
    return false;
  }
};

/**
 * @param {Parameters<typeof fs.promises.readdir>[0]} path
 * @returns {Promise<string[]>} Whether or not the file was removed
 */
const readdirFunc = async (path) => {
  try {
    const result = await fs.promises.readdir(path);
    updatePathOpRes(path, "readdir", result);
    return result;
  } catch (error) {
    updatePathOpRes(path, "readdir", error);
    return [];
  }
};

/**
 * @param {Parameters<typeof fs.promises.stat>[0] | Parameters<typeof fs.promises.writeFile>[0]} path
 */
const statFunc = async (path) => {
  try {
    let result;
    if (
      path &&
      typeof path === "object" &&
      !(path instanceof URL) &&
      typeof path?.["stat"] === "function"
    ) {
      result = await path?.["stat"]();
    } else if (typeof path === "string") {
      result = await fs.promises.stat(path);
    } else {
      console.log("Unexpected path type", path);
      process.exit(163);
    }
    updatePathOpRes(path, "stat", result);
    return {
      path,
      size: result.size,
      atimeMs: result.atimeMs,
      mtimeMs: result.mtimeMs,
      ctimeMs: result.ctimeMs,
      isDirectory: result.isDirectory() ? isYes : isNo,
      isFile: result.isFile() ? isYes : isNo,
    };
  } catch (error) {
    updatePathOpRes(path, "stat", error);
    return {
      path,
      size: NaN,
      atimeMs: NaN,
      mtimeMs: NaN,
      ctimeMs: NaN,
      isDirectory: isNo,
      isFile: isNo,
    };
  }
};

/**
 * @param {Parameters<typeof fs.promises.mkdir>[0]} path
 * @returns {Promise<boolean>} Whether or not the folder was created (false if it already exists)
 */
const mkdirFunc = async (path, options = { recursive: true }) => {
  try {
    const result = await fs.promises.mkdir(path, options);
    updatePathOpRes(path, "mkdir", result);
    return true; // Directory created successfully
  } catch (error) {
    updatePathOpRes(path, "mkdir", error);
    if (error.code === "EEXIST") {
      // Directory already exists, treat as success
      return true;
    }
    return false; // Failed to create directory
  }
};

export const sfs = {
  readFile: readFileFunc,
  readTextFile: readTextFileFunc,
  writeFile: writeFileFunc,
  appendFile: appendFileFunc,
  unlink: unlinkFunc,
  readdir: readdirFunc,
  stat: statFunc,
  mkdir: mkdirFunc,
  getLastPath,
  getLastOp,
  getLastRes,
  wasLastError,
  getLast,
};
