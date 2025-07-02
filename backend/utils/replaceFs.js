import path from 'path';
import fs from 'fs';
import process from 'process';
import child_process from 'child_process';

const logStarts = true;
const logErrors = true;
const logReads = false;
const logWrites = true;

const printBeforeFsOperations = "";
const printAfterFsOperations = "";
const createParentFolderOnFileWriteEnoent = true;
const returnUndefinedOnEnoentRead = true;
const returnUndefinedOnEnoentStat = true;

const formatLog = (prefix = "", path = "", ...args) =>
  console.log(`\x1b[92m${prefix}\x1b[0m \x1b[36m${path}\x1b[0m`, ...args);

const startLog = !logStarts
  ? () => {}
  : (prefix = "", path = "", ...args) => formatLog(prefix, path, ...args);

const errorLog = !logErrors
  ? () => {}
  : (prefix = "", path = "", ...args) =>
      formatLog(
        prefix,
        path,
        typeof args[0] === "string" ? `\x1b[31m${args[0]}\x1b[0m` : args[0],
        ...args.slice(1)
      );

/**
 * @param {any} filePath
 * @param {boolean} asRelative
 * @returns {string}
 */
function localNormalizeFilePath(filePath, asRelative = true) {
  if (filePath === null || filePath === undefined) {
    throw new Error(
      `Unexpected file system path argument: ${JSON.stringify(filePath)}`
    );
  }
  if (typeof filePath !== "string") {
    throw new Error(
      `Unexpected file system path argument type: ${JSON.stringify(
        typeof filePath
      )}`
    );
  }
  if (filePath.length === 0) {
    throw new Error(`Invalid empty file system path (0 characters)`);
  }
  const disallowedChars = filePath
    .split("")
    .filter((f) => '\\*?"<>|'.includes(f))
    .join("");
  if (disallowedChars) {
    throw new Error(
      `Invalid file system path with disallowed characters ${JSON.stringify(
        disallowedChars
      )} at ${JSON.stringify(filePath)}`
    );
  }
  filePath = path.resolve(filePath).replace(/\//g, "/");
  const disallowedSubstr = ["undefined", "null", "NaN"].find(
    (bad) =>
      filePath.includes(`/${bad}/`) ||
      filePath.includes(`/${bad}.`) ||
      filePath.includes(`/${bad}-`) ||
      filePath.endsWith(`.${bad}`) ||
      filePath.endsWith(`/${bad}`)
  );
  if (disallowedSubstr) {
    throw new Error(
      `Path contains disallowed substring ${JSON.stringify(
        disallowedSubstr
      )} at ${JSON.stringify(filePath)}`
    );
  }
  if (!asRelative) {
    return filePath;
  }
  const cwd = process.cwd().replace(/\//g, "/");
  if (filePath.startsWith(`${cwd}/`)) {
    return `.${filePath.substring(cwd.length)}`;
  }
  if (
    [`${cwd}`, `${cwd}/`, `${cwd}/.`, `${cwd}/./`, `${cwd}/./.`].includes(
      filePath
    )
  ) {
    return filePath.endsWith("/") ? "./" : ".";
  }
  return filePath;
}

export default function replaceFs() {
  // @ts-ignore
  global.fs = fs;
  // @ts-ignore
  global.path = path;
  // @ts-ignore
  global.child_process = child_process;

  /** @type {any} */
  const cache = replaceFs;

  if (cache["_init"]) {
    return;
  }

  const methods = {
    _ws: fs.writeFileSync,
    _as: fs.appendFileSync,
    _rs: fs.readFileSync,
    _ss: fs.statSync,

    _w: fs.promises.writeFile,
    _a: fs.promises.appendFile,
    _r: fs.promises.readFile,
    _s: fs.promises.stat,
  };

  cache["_init"] = methods;

  fs.writeFileSync = wrapSyncFsOp.bind(fs, methods._ws);
  fs.appendFileSync = wrapSyncFsOp.bind(fs, methods._as);
  fs.readFileSync = wrapSyncFsOp.bind(fs, methods._rs);

  fs.promises.writeFile = wrapAsyncFsOp.bind(fs.promises, methods._w);
  fs.promises.appendFile = wrapAsyncFsOp.bind(fs.promises, methods._a);
  fs.promises.readFile = wrapAsyncFsOp.bind(fs.promises, methods._r);

  try {
    // @ts-ignore
    fs.statSync = wrapSyncFsOp.bind(fs, methods._ss);
  } catch (err) {}
  try {
    // @ts-ignore
    fs.promises.stat = wrapAsyncFsOp.bind(fs.promises, methods._s);
  } catch (err) {}

  const ls = logStarts;
  const le = logErrors;

  function parseFsOp(method, filePath, ...args) {
    const self = method.name.includes("Sync") ? fs : fs.promises;
    const id = `[fs.${self === fs.promises ? "promises." : ""}${method.name}]`;
    const isRead = method === methods._rs || method === methods._r;
    const isWrite = method === methods._ws || method === methods._w;
    const isAppend = method === methods._as || method === methods._a;
    const isStat = method === methods._s || method === methods._ss;
    filePath = localNormalizeFilePath(filePath);
    const exists = fs.existsSync(filePath);
    const parentExists = fs.existsSync(path.dirname(filePath));
    printBeforeFsOperations && process.stdout.write(printBeforeFsOperations);

    if (args[0] && (ls || le) && (isWrite || isAppend)) {
      if (typeof args[0] !== "string" && !(args[0] instanceof Buffer)) {
        throw new Error(
          `Unexpected ${isWrite ? 'write' : 'append'} argument of type "${typeof args[0]}"`
        );
      }
    }

    if ((!isRead || logReads) && (!isWrite || logWrites) && logStarts) {
      startLog(
        id,
        filePath,
        exists && isAppend
          ? "(appending)"
          : exists && isWrite
          ? "(overwritting)"
          : exists
          ? "(exists)"
          : (isWrite || isAppend) && parentExists
          ? "(will be created)"
          : parentExists
          ? "(does not exist)"
          : "(parent does not exist)",
        isRead && typeof args[0] === "string"
          ? `(${args[0]})`
          : !isWrite && !isAppend ? "" : typeof args[0] === "string"
            ? args[0].length
            : args[0] instanceof Buffer
            ? args[0].byteLength
            : NaN,
        isWrite || isAppend
          ? typeof args[0] === "string"
            ? "chars"
            : args[0] instanceof Buffer
            ? "bytes"
            : "?"
          : ""
      );
    }
    return {
      self,
      id,
      filePath,
      isRead,
      isWrite,
      isAppend,
      isStat,
      exists,
      parentExists,
    };
  }

  function wrapSyncFsOp(method, rawFilePath, ...args) {
    const {
      self,
      id,
      isWrite,
      isAppend,
      isRead,
      isStat,
      parentExists,
      filePath,
    } = parseFsOp(method, rawFilePath, ...args);
    try {
      if (
        createParentFolderOnFileWriteEnoent &&
        !parentExists &&
        (isWrite || isAppend)
      ) {
        ls && console.log("[fs] Creating parent folder of", [filePath], "...");
        fs.mkdirSync(path.dirname(path.resolve(filePath)));
      }
      const r = method.call(self, filePath, ...args);
      printAfterFsOperations && process.stdout.write(printAfterFsOperations);
      return r;
    } catch (err) {
      printAfterFsOperations && process.stdout.write(printAfterFsOperations);
      const isNotFound = err.code === "ENOENT";
      if (isNotFound && returnUndefinedOnEnoentRead && isRead) {
        return undefined;
      }
      if (isNotFound && returnUndefinedOnEnoentStat && isStat) {
        return undefined;
      }
      if (
        isNotFound &&
        createParentFolderOnFileWriteEnoent &&
        (isWrite || isAppend)
      ) {
        ls && console.log("[fs] Creating parent folder of", [filePath], "...");
        fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
        printBeforeFsOperations &&
          process.stdout.write(printBeforeFsOperations);
        const r = method.call(self, filePath, ...args);
        printAfterFsOperations && process.stdout.write(printAfterFsOperations);
        return r;
      }
      le && errorLog(id, filePath, err.code, "Error:", err.message);
      throw err;
    }
  }

  async function wrapAsyncFsOp(method, rawFilePath, ...args) {
    const {
      self,
      id,
      isWrite,
      isAppend,
      isRead,
      isStat,
      parentExists,
      filePath,
    } = parseFsOp(method, rawFilePath, args);
    try {
      if (
        createParentFolderOnFileWriteEnoent &&
        !parentExists &&
        (isWrite || isAppend)
      ) {
        ls && console.log("[fs] Creating parent folder of", [filePath], "...");
        await fs.promises.mkdir(path.dirname(path.resolve(filePath)));
      }
      const r = await method.call(self, filePath, ...args);
      printAfterFsOperations && process.stdout.write(printAfterFsOperations);
      return r;
    } catch (err) {
      le && errorLog(id, filePath, "Failed with code", [err.code]);
      if (err.code === "ENOENT") {
        if (
          (returnUndefinedOnEnoentRead && isRead) ||
          (returnUndefinedOnEnoentStat && isStat)
        ) {
          return undefined;
        }
        if (
          createParentFolderOnFileWriteEnoent &&
          (method === methods._ws || method === methods._as)
        ) {
          fs.promises.mkdir(path.dirname(path.resolve(filePath)));
          printBeforeFsOperations &&
            process.stdout.write(printBeforeFsOperations);
          const r = await method.call(fs.promises, filePath, ...args);
          printAfterFsOperations &&
            process.stdout.write(printAfterFsOperations);
          return r;
        }
      }
      throw err;
    }
  }
}
