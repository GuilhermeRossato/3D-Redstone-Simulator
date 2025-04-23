import { sfs } from "./sfs.js";
import { isProcessRunningByPid } from "./isProcessRunningByPid.js";
import getDateTimeString from "./getDateTimeString.js";
import { backendPath } from "./init.js";

const debugSave = true;
const debug = false;

/**
 *
 * @template {{[name: string]: unknown}} T // Constrain T to be an object with string keys
 * @param {string} type The string type of the store. This is used to create a unique store for each type.
 * @param {(t?: any)=>T} [parser] Method used to parse each entry. Also used to infer the type of T.
 * @param {Partial<{maxLoaded: number, writeDelay: number, combineLimit: number, countEntries: boolean, manualSave: boolean, maxPerFile: number, limitState: boolean}>} [storeConfig]
 */
export async function createStore(
  type = "",
  parser = (t) => t,
  storeConfig = {}
) {
  const log = debug ? (...args) => console.log([type], ...args) : () => {};
  /** @type {typeof storeObj} */
  const cached = createStore[`cached-${type}`];
  if (cached) {
    return cached;
  }
  /** @type {{id: string, saved: number, created: number, updated: number, state: T, file?: string, snaps: ({t: number} & Record<string, any>)[], update: typeof update}[]} */
  let entryList = [];
  const root = `${backendPath}/data/${type}`;
  await sfs.mkdir(root, { recursive: true });
  const metaPath = `${root}/meta.json`;
  let firstMetadata = false;
  let lockedMetadata = false;
  let metaText = "";
  let m = undefined;

  let currentTime = 0;
  let currentFile = "";
  let currentCount = 0;

  // Define a mutex for the `operateMetadata` method
  let metadataMutex = Promise.resolve();
  let metadataBusy = false;

  let metadataPromises = [];

  let operateCount = 0;

  /**
   * Returns the metadata object, optionally transforming it with an operate method (if it changes then it is saved to disk).
   * @param {(meta: Record<string, any>) => any} [operate] Optional operate method that receives the current meta data object and can alter its keys to update it.
   * @param {boolean} [checkLock=true] Whether to check if the metadata is locked by another process and throw an exception if it is.
   */
  const operateMetadata = async (operate, checkLock = true) => {
    const oid = operateCount++;
    /** @type {any} */
    let resolve = () => {};
    const promise = new Promise((r) => (resolve = r));
    metadataPromises.push({ oid, promise });
    let lastPromise;
    while (metadataPromises.length) {
      if (lastPromise === metadataPromises[0].promise) {
        log(
          "Operate id",
          oid,
          "is removing promise of",
          metadataPromises[0].oid
        );
        metadataPromises.shift();
      }
      lastPromise = metadataPromises[0].promise;
      if (!lastPromise || lastPromise === promise) {
        break;
      }
      log(
        "Operate id",
        oid,
        "is waiting",
        metadataPromises.length - 1,
        "promises to write to metadata"
      );
      await lastPromise;
    }
    const finalize = () => {
      if (metadataPromises[0]?.promise === promise) {
        metadataPromises.shift();
        metadataPromises.length &&
          log("There are", metadataPromises.length, "promises after", oid);
        resolve();
        return;
      }
      resolve();
      throw new Error("First metadata promise does not maatch the current");
    };

    if (metadataBusy) {
      finalize();
      throw new Error("Metadata operation is busy (incorrect promise handling");
    }
    if (operate && typeof operate !== "function") {
      finalize();
      throw new Error("Metadata operation argument is not a function");
    }
    if (operate) {
      metadataBusy = true;
    }
    try {
      metaText = await sfs.readTextFile(metaPath);
      m = JSON.parse(metaText || "{}");
      if (!m.created) {
        m.created = Date.now();
      }
      if (!m.propTypes) {
        m.propTypes = {};
      }
      if (!m.config) {
        m.config = {};
      }
      if (
        checkLock &&
        m.lock &&
        (m.lock.owner !== process.pid || m.lock.parent !== process.ppid)
      ) {
        const isRunning = await isProcessRunningByPid(m.lock.owner);
        if (isRunning) {
          log("Metadata is locked by another process", m.lock);

          finalize();
          throw new Error(
            `Could not operate metadata because it is locked by ${m.lock.owner} (parent: ${m.lock.parent})`
          );
        }
        const sameUpdateDate = m.lock.created === m.lock.updated;
        log(
          "Metadata is not locked by the process",
          m.lock.owner,
          "created at",
          m.lock.created,
          sameUpdateDate ? "" : "last updated at",
          sameUpdateDate ? "" : m.lock.updated
        );
      } else if (checkLock && !m.lock && firstMetadata) {
        log("Metadata is not locked by any process");
      }
      if (!operate) {
        metadataBusy = false;

        finalize();
        return m;
      }

      let r;
      try {
        r = operate(m);
        if (r instanceof Promise) {
          r = await r;
        }
      } catch (err) {
        log("Failed operating on", [type], "metadata:", err.message);

        finalize();
        throw err;
      }
      if (r && r !== m && r !== true) {
        finalize();
        throw new Error(`Operation on metadata returned: ${JSON.stringify(r)}`);
      }
      if (!lockedMetadata && m?.lock?.owner === process.pid) {
        lockedMetadata = true;
        log("Metadata has been locked by the current process:", process.pid);
        m.lock.created = getDateTimeString();
        m.lock.updated = m.lock.created;
      }
      const pretty = JSON.stringify(m, null, "  ");
      const unchanged = pretty === metaText;
      if (firstMetadata) {
        firstMetadata = false;
        if (unchanged) {
          log("Warning: First metadata operation did not change stored data");

          metadataBusy = false;

          finalize();
          return m;
        }
        log("First metadata operation changed stored object data");
      } else if (unchanged) {
        log("Metadata operation did not change stored object data");

        metadataBusy = false;

        finalize();
        return m;
      }
      m.lock.updated = getDateTimeString();
      if (debugSave) {
        console.log("[storage.js] Saving to", metaPath);
      }
      await sfs.writeFile(metaPath, pretty);
      metadataBusy = false;
      finalize();
    } catch (err) {
      log("Failed processing metadata:", err.message);

      metadataBusy = false;
      finalize();
    }
    return m;
  };

  // Lock, Update config
  await operateMetadata((m) => {
    log("Started initial operating on", [type], "metadata:", m);
    m.lock = {
      parent: process.ppid,
      owner: process.pid,
      locked: Date.now(),
    };
    if (storeConfig && typeof storeConfig === "object") {
      if (!m.config) {
        m.config = {};
      }
      for (const key in storeConfig) {
        if (
          storeConfig[key] === undefined ||
          storeConfig[key] === m.config[key]
        ) {
          continue;
        }
        if (storeConfig[key] === null) {
          delete storeConfig[key];
          delete m.config[key];
          continue;
        }
        m.config[key] = storeConfig[key];
      }
      for (const key in m.config) {
        if (storeConfig[key] === undefined) {
          storeConfig[key] = m.config[key];
        }
      }
      if (m.count !== undefined && storeConfig.countEntries === false) {
        delete m.count;
      } else if (
        !m.count &&
        (storeConfig.countEntries === true || m.config.countEntries === true)
      ) {
        m.count = 0;
      }
    }
    log("Finished initial operating on", [type], "metadata:", m);
  });

  /** @type {Map<string, number>} */
  const dirty = new Map();

  let saveTimeout = null;

  /** @type {Map<string, typeof entryList[number]>} */
  const active = new Map();

  /** @type {Map<string, string>} */
  const cold = new Map();

  const addActive = (entry, strict = true) => {
    if (!entry?.id || !(entry?.snaps instanceof Array)) {
      throw new Error("Invalid entry");
    }
    if (active.has(entry.id)) {
      if (strict) {
        throw new Error("Entry already on active list");
      }
      return entry;
    }
    active.set(entry.id, entry);
    entryList.push(entry);
    return entry;
  };

  const removeActive = (entry, strict = true) => {
    try {
      if (!entry?.id || !(entry?.snaps instanceof Array)) {
        throw new Error("Invalid entry");
      }
      const match = active.get(entry.id);
      if (!match) {
        throw new Error("Entry not found in active list");
      }
      const i = entryList.indexOf(match);
      if (i === -1) {
        throw new Error("Entry found in active list but not entry list");
      }
      entryList.splice(i, 1);
      return true;
    } catch (err) {
      if (strict) {
        throw err;
      }
      log("[Ignored] Failure to remove entry from active list:", err.message);
      return false;
    }
  };

  const saveDirty = async () => {
    saveTimeout = null;
    const now = Date.now();
    const toSave = [];
    dirty.forEach((time, id) => {
      if (now - time < (storeConfig.writeDelay || 1000)) {
        return;
      }
      dirty.delete(id);
      let entry = entryList.find((a) => a.id === id);
      if (!entry) {
        entry = active.get(id);
        log(
          "Could not find entry on entryList",
          entry ? "but found on active set" : "and neither active set"
        );
      }
      if (entry) {
        toSave.push(entry);
        return;
      }
      log("Could not find entry of id", id, "to update (it was dirty)");
    });
    if (toSave.length) {
      await save(...toSave);
    }
  };

  const setDirty = (id, time) => {
    if (!id || dirty.has(id)) {
      return;
    }
    dirty.set(id, time);
    if (!storeConfig?.manualSave && !saveTimeout) {
      saveTimeout = setTimeout(saveDirty, storeConfig.writeDelay || 1000);
    }
  };

  /**
   * Method present on each object used to update selected object keys.
   * @param {Record<string, any>} keyValueRecord
   * @param {boolean} [markDirty=true] Whether or not to add the object to the dirty list to be eventually saved to disk.
   */
  function update(keyValueRecord, markDirty = true) {
    /** @type {typeof entryList[number]} */ // @ts-ignore
    const entry = this;
    if (!(entry.snaps instanceof Array)) {
      throw new Error("Invalid self");
    }
    if (
      !entry.id &&
      keyValueRecord.id &&
      typeof keyValueRecord.id === "string"
    ) {
      entry.id = keyValueRecord.id;
    }
    if (!entry.id) {
      throw new Error("Cannot update object without id");
    }
    const lastSnap = entry.snaps[entry.snaps.length - 1];
    const nowRelative = Date.now() - entry.created;
    /** @type {[string, unknown][]} */
    let snap = [];
    if (lastSnap) {
      if (
        lastSnap.t > entry.saved &&
        nowRelative - lastSnap.t < storeConfig.combineLimit
      ) {
        log(
          "Combining",
          entry.id,
          "update with",
          nowRelative - lastSnap.t,
          "elapsed"
        );
      }
      snap = Object.entries(lastSnap);
    } else {
      snap = [["t", nowRelative]];
    }
    const parentKeys = ["id", "saved", "state", "snaps"];
    const parentsList = parentKeys.flatMap((key) =>
      Object.entries(keyValueRecord).filter(
        (p) => p[0] === key && p[1] !== undefined
      )
    );
    const keyValues = Object.entries(
      parentsList.length === parentKeys.length && keyValueRecord.state
        ? keyValueRecord.state
        : keyValueRecord
    ).filter((p) => p[1] !== undefined);
    const updates = [];
    const propTypes = m.propTypes || {};
    const newPropsType = [];
    for (const [key, value] of keyValues) {
      if (key === "id" && (!value || value === entry.id)) {
        continue;
      }
      if (key === "id" && entry.id && value && value !== entry.id) {
        throw new Error(
          `Cannot change key ${key} from ${JSON.stringify(
            entry[key]
          )} to ${JSON.stringify(value)}`
        );
      }
      const propType = propTypes[key];
      if (
        propType === undefined &&
        (value === undefined || value === null || key[0] === "_")
      ) {
        continue;
      }
      if (propType === undefined) {
        if (storeConfig.limitState) {
          throw new Error(
            `Cannot add property "${key}" to "${type}" on update because strict mode is active`
          );
        }
        newPropsType.push([
          key,
          value && typeof value === "object" && value instanceof Array
            ? "array"
            : typeof value,
        ]);
      }
      const index = snap.findIndex(([k]) => k === key);
      if (index !== -1 && value === snap[index][1]) {
        continue;
      }
      if (index !== -1) {
        snap.splice(index, 1);
      }
      if (entry.state[key] === value) {
        continue;
      }
      updates.push([key, value]);
      // @ts-ignore
      entry.state[key] = value;
    }
    if (!updates.length) {
      log("Entry not altered (every key value matches)");
      return entry;
    }
    if (newPropsType.length) {
      log(
        `Object update`,
        `added`,
        newPropsType.length,
        `new properties:`,
        newPropsType.map((a) => a[0])
      );
      operateMetadata((m) => {
        const propTypes = m.propTypes || (m.propTypes = {});
        for (const [key, typeDesc] of newPropsType) {
          propTypes[key] = typeDesc;
        }
      })
        .then(() => {
          log(
            "Updated metadata with new properties:",
            newPropsType.map((a) => a[0])
          );
        })
        .catch((err) => {
          console.error(
            "Failed to update metadata with new properties:",
            newPropsType.map((a) => a[0]),
            "because of:",
            err.message
          );
        });
    }

    for (const [key, value] of updates) {
      const match = snap.find(([k]) => k === key);
      if (match) {
        match[1] = value;
      } else {
        snap.push([key, value]);
      }
      // @ts-ignore
      entry.state[key] = value;
    }
    if (markDirty && snap.length > 0) {
      setDirty(entry.id, nowRelative);
      const ti = snap.findIndex(([k]) => k === "t");
      if (ti === -1) {
        snap.unshift(["t", nowRelative]);
      }
      /** @type {any} */
      const snapObj = Object.fromEntries(snap);
      entry.snaps.push(snapObj);
    }
    entry.updated = Date.now() - (entry.created || 0);
    return entry;
  }
  async function resetFile(reason) {
    if (!reason) {
      return;
    }
    log("Resetting file because of:", reason);
    const now = Date.now();
    const dateStr = getDateTimeString(now);
    const yearMonthFolder = `${root}/${dateStr.substring(0, "2000-01".length)}`;
    const stat = await sfs.stat(yearMonthFolder);
    if (!stat || !stat.isDirectory()) {
      log("Creating store year-month folder:", yearMonthFolder);
      await sfs.mkdir(yearMonthFolder, { recursive: true });
    }
    currentTime = now;
    currentFile = `${yearMonthFolder}/${dateStr
      .substring("2000-00-".length, "2000-01-01 00:00:00".length)
      .replace(/\D/g, "-")}.txt`;
    currentCount = 0;
    log("Set store file to", currentFile);
    const f = await sfs.stat(currentFile);
    if (f.isFile()) {
      log("Target file already exists:", currentFile);
    } else {
      if (!currentFile) {
        throw new Error("Invalid current file");
      }
      if (debugSave) {
        console.log("[storage.js] Appending to", currentFile);
      }
      await sfs.appendFile(currentFile, `\n`);
    }
  }

  /**
   * @param {...(typeof entryList[number] | (typeof entryList[number][]))} args
   */
  async function save(...args) {
    debugSave && console.log("Saving started to", args);
    const now = Date.now();
    if (
      !currentTime ||
      now - currentTime > 12 * 60 * 60 * 1000 ||
      (storeConfig.maxPerFile && currentCount > storeConfig.maxPerFile)
    ) {
      await resetFile();
    }
    const nodes = args.flat();
    for (const entry of nodes) {
      if (!entry?.id || !entry?.snaps?.length) {
        throw new Error("Cannot save invalid entry: ${JSON.stringify(entry)}");
      }
      entry.snaps = entry.snaps.filter((s) => s.t > entry.saved);
      if (!entry.snaps.length) {
        console.log(`Saving entry with no snapshots: ${entry.id}`);
      }
      entry.saved = now - (entry.created || 0);
      delete entry.file;
      if (!currentFile) {
        console.log("Initializing current file for", root);
        const now = Date.now();
        const dateStr = getDateTimeString(now);
        const yearMonthFolder = `${root}/${dateStr.substring(
          0,
          "2000-01".length
        )}`;
        currentFile = `${yearMonthFolder}/${dateStr
          .substring("2000-00-".length, "2000-01-01 00:00:00".length)
          .replace(/\D/g, "-")}.txt`;
      }
      if (!currentFile) {
        throw new Error("Invalid current file");
      }
      if (debugSave) {
        console.log("[storage.js] Appending to", currentFile);
      }
      await sfs.appendFile(
        currentFile,
        `${entry.id}: ${JSON.stringify(entry)}\n`
      );
      entry.file = currentFile;
      currentCount++;
      if (storeConfig.maxPerFile && currentCount > storeConfig.maxPerFile) {
        await resetFile();
      }
    }
    return {
      nodes,
      file: currentFile,
      count: currentCount,
    };
  }

  async function unload(count) {
    if (!(this.list instanceof Array)) {
      throw new Error("Invalid context to unload");
    }
    const slice = [];
    const toSave = [];
    for (let i = Math.min(count, this.list.length) - 1; i >= 0; i--) {
      const entry = this.list[i];
      slice.push(entry);
    }
    for (const entry of slice) {
      removeActive(entry, true);
      if (entry.file) {
        cold.set(entry.id, entry.file);
      }
      if (entry.snaps[entry.snaps.length - 1].t > entry.saved) {
        toSave.push(entry);
      }
    }
    if (toSave.length) {
      await save(...toSave);
    }
    return slice;
  }

  /**
   * Finds and loads entries using a query object.
   * @param {number} limit Maximum number of entries returnes
   * @param {Record<string, any>} query
   * @param {boolean} [strict=false]
   * @param {boolean} [markLoaded=true]
   * @returns {Promise<typeof entryList>}
   */
  async function load(limit, query, strict = false, markLoaded = true) {
    if (!limit || isNaN(limit)) {
      limit = 1;
    } else if (
      storeConfig.maxLoaded &&
      typeof storeConfig.maxLoaded === "number" &&
      limit > storeConfig.maxLoaded
    ) {
      limit = storeConfig.maxLoaded;
    }
    let yearMonthList = [];
    const format = Object.keys(query).sort().join(",");
    if (
      format === "id" &&
      typeof query.id !== "object" &&
      active.has(query.id)
    ) {
      return this.list.filter((item) => item.id === query.id);
    }
    if (format === "id" && typeof query.id !== "object" && cold.has(query.id)) {
      const file = cold.get(query.id);
      const path = `${root}/${file}`;
      const text = await sfs.readTextFile(path);
      const entry = await findDataFileEntryById(query.id, text);
      if (!entry) {
        cold.delete(query.id);
        throw new Error(
          `Failed to find "${query.id}" of type "${type}" in "${file}"`
        );
      }
      cold.delete(query.id);
      if (markLoaded) {
        addActive(entry);
      }
      return [entry];
    }
    if (format === "id" && typeof query.id !== "object") {
      if (!yearMonthList.length) {
        yearMonthList = await getYearMonthList();
      }
      for (const yearMonth of yearMonthList) {
        log("Looking for id", query.id, "in", yearMonth);
        const ids = await sfs.readTextFile(`${root}/${yearMonth}/ids.txt`);
        const i = ids.startsWith(`${query.id}\n`)
          ? 0
          : ids.indexOf(`\n${query.id}\n`);
        if (i === -1) {
          continue;
        }
        const datas = await getDataFileNameList(yearMonth);
        for (const file of datas) {
          log(
            "Looking for id",
            query.id,
            "in",
            `./data/${type}/${yearMonth}/${file}`
          );
          const text = await sfs.readTextFile(`${root}/${yearMonth}/${file}`);
          if (!text || text.length < query.id.length) {
            continue;
          }
          if (!file.endsWith(".txt")) {
            throw new Error(`File "${file}" is not a text file`);
          }
          const entry = await findDataFileEntryById(query.id, text);
          if (!entry) {
            continue;
          }
          if (markLoaded) {
            addActive(entry);
          }
          return [entry];
        }
      }
      if (strict) {
        throw new Error(`Failed to find "${query.id}" of type "${type}"`);
      }
      return [];
    }
    let isFetched = false;
    let c = 0;
    const list = [];
    yearMonthList = await getYearMonthList();
    let dataFileNameList = [];
    let entries = [...this.list].reverse();
    const set = new Set();
    while (c < limit) {
      if (entries.length) {
        const entry = entries.shift();
        const state = entry.state;
        if (
          state &&
          !set.has(entry.id) &&
          Object.entries(query).every(
            ([key, value]) =>
              (key === "id" &&
                (value === undefined ||
                  value === null ||
                  (typeof value === "string" && value === entry.id) ||
                  (value &&
                    value instanceof Array &&
                    value.includes(entry.id)))) ||
              value === undefined ||
              (value === null && state[key] === undefined) ||
              (value === undefined && state[key] === null) ||
              (value === true && state[key] === 1) ||
              (value === 1 && state[key] === true) ||
              (value === false && state[key] === 0) ||
              (value === 0 && state[key] === false) ||
              state[key] === value ||
              (value &&
                typeof value === "object" && // @ts-ignore
                value instanceof Array && // @ts-ignore
                value.includes(state[key]))
          )
        ) {
          set.add(state.id);
          list.push(state);
          if (isFetched && markLoaded) {
            addActive(entry);
          }
          c++;
        }
        continue;
      }
      if (!dataFileNameList.length) {
        const yearMonth = yearMonthList.shift();
        if (!yearMonth) {
          break;
        }
        const names = await getDataFileNameList(yearMonth);
        dataFileNameList = names.map((f) => `${yearMonth}/${f}`);
        continue;
      }
      const file = dataFileNameList.shift();
      if (!file) {
        break;
      }
      const text = await sfs.readTextFile(`${root}/${file}`);
      entries = await getDataFileEntries(text, file);
    }
    if (strict && !list.length) {
      throw new Error(
        `Failed to find entry of type "${type}" with query "${JSON.stringify(
          query
        )}"`
      );
    }
    if (storeConfig.maxLoaded && storeConfig.maxLoaded < this.list.length) {
      this.unload(this.list.length - storeConfig.maxLoaded);
    }
    return list;
  }

  /**
   * @param {T} state The state of the object to create
   * @param {boolean} [markDirty=true] Whether or not to include the element in the dirty list.
   * @param {boolean} [includeActive=true] Whether or not to add the element in the active list.
   * @param {boolean} [expandUndef=true] Whether to expand the state by ádding empty typed values from prop types.
   */
  async function create(
    state,
    markDirty = true,
    includeActive = true,
    expandUndef = true
  ) {
    log("Creating object with state:", state);
    /** @type {any} */
    const any = !state || typeof state !== "object" ? {} : state;

    /** @type {Record<string, string>} */
    const propTypes = m.propTypes || {};
    const newPropsType = [];
    const keys = new Set([...Object.keys(any), ...Object.keys(propTypes)]);

    for (const key of keys) {
      const value = any[key];
      const propType = propTypes[key];
      if (
        propType !== undefined ||
        value === undefined ||
        value === null ||
        key[0] === "_"
      ) {
        continue;
      }
      if (storeConfig.limitState) {
        throw new Error(
          `Cannot add property "${key}" to "${type}" on create because strict mode is active`
        );
      }
      newPropsType.push([
        key,
        value && typeof value === "object" && value instanceof Array
          ? "array"
          : typeof value,
      ]);
    }

    for (const key of keys) {
      const value = any[key];
      const propType = propTypes[key];
      if (value === undefined && expandUndef && propType) {
        any[key] = {
          string: "",
          number: 0,
          boolean: false,
          array: [],
          object: {},
        }[propType];
      }
      if (typeof value === "function") {
        log(`Unexpected function as value for state property "${key}"`, value);
      }
    }
    const { prevId } = await operateMetadata((m) => {
      if (newPropsType.length) {
        log(
          `Object create`,
          `added`,
          newPropsType.length,
          `new properties:`,
          newPropsType.map((a) => a[0])
        );
        const propTypes = m.propTypes || (m.propTypes = {});
        for (const [key, typeDesc] of newPropsType) {
          propTypes[key] = typeDesc;
        }
      }
      if (typeof m.count === "number") {
        m.count++;
      }
      if (state.id) {
        m.prevId = state.id;
      } else {
        const num = m.nextNum || 0;
        m.nextNum = num + 1;
        const numStr = num.toString();
        if (m.prevId && numStr.length > m.prevId.length - 2) {
          m.prevId = `${m.prevId.replace(/\d/g, "0")}0`;
        }
        m.prevId = `${type[0].toLowerCase()}-${numStr.padStart(
          (m.prevId?.length || 5) - 2,
          "0"
        )}`;
      }
    });
    if (markDirty && !dirty.has(prevId)) {
      setDirty(prevId, Date.now());
    }
    const entry = {
      id: prevId,
      saved: 0,
      state: any,
      file: "",
      created: Date.now(),
      updated: 0,
      snaps: [{ t: 1 }],
      update,
    };
    if (entry.snaps[0].id) {
      delete entry.snaps[0].id;
    }
    if (entry.state.id === entry.id) {
      delete entry.state.id;
    }
    if (includeActive) {
      addActive(entry);
    }
    return entry;
  }
  async function getYearMonthList() {
    const nodes = await sfs.readdir(root);
    return nodes
      .filter((f) => f.length === "2000-01".length && /^\d{4}-\d{2}$/.test(f))
      .sort()
      .reverse();
  }
  async function getDataFileEntries(text, file = "") {
    return text
      .split("\n")
      .reverse()
      .flatMap((line, k, arr) => {
        const i = line.indexOf(`: {`);
        if (i === -1) {
          return [];
        }
        const id = line.substring(0, i).trim();
        const j = line.lastIndexOf("}");
        if (j === -1) {
          return [];
        }
        try {
          const json = line.substring(
            i + 1 + id.length + 2,
            j === -1 ? line.indexOf("}", i + 1) : j + 1
          );
          const obj = JSON.parse(json);
          if (!obj.id) {
            obj.id = id;
          }
          return [obj];
        } catch (err) {
          console.error(
            "Failed to parse JSON on line",
            arr.length - k,
            "of",
            file,
            "because of:",
            err.message
          );
          return [];
        }
      });
  }
  async function findDataFileEntryById(id, text) {
    const i = text.startsWith(`${id}: {`) ? 0 : text.indexOf(`\n${id}: {`);
    if (i === -1) {
      return;
    }
    const j = text.indexOf("}\n", i + 1);
    const json = text.substring(
      i + 1 + id.length + 2,
      j === -1 ? text.indexOf("}", i + 1) : j + 1
    );
    const obj = JSON.parse(json);
    if (!obj.id) {
      obj.id = id;
    }
    return obj;
  }
  async function getDataFileNameList(yearMonth) {
    const nodes = await sfs.readdir(`${root}/${yearMonth}`);
    return nodes
      .filter(
        (f) =>
          f.length >= "dd-hh-mm-ss".length &&
          f.includes(".") &&
          /^\d{2}-\d{2}-\d{2}-\d{2}\./.test(f)
      )
      .sort()
      .reverse();
  }
  const storeObj = {
    metadata: operateMetadata,
    root,
    list: entryList,
    load,
    unload,
    create,
    setLimitState(value) {
      storeConfig.limitState = value;
      return this;
    },
  };
  return storeObj;
}

const loadUsers = createStore.bind(null, "users");
const loadRooms = createStore.bind(null, "rooms");
const loadItems = createStore.bind(null, "items");
const loadWorld = createStore.bind(null, "world");

export const loaders = {
  users: loadUsers,
  rooms: loadRooms,
  items: loadItems,
  world: loadWorld,
};

export const loaded = {
  users: new Set(),
  rooms: new Set(),
  items: new Set(),
  world: new Set(),
};

export const record = {
  users: loadUsers({ n: 16 }),
  rooms: loadRooms({ n: 16 }),
  items: loadItems({ n: 16 }),
  world: loadWorld({ n: 16 }),
};

export const entities = await createStore(
  "entities",
  () => ({
    type: "",
    position: [0, 0, 0],
    direction: [0, 0, 0],
    health: 0,
    maxHealth: 0,
    path: [0, 0, 0],
    player: "",
    target: "",
  }),
  {
    maxPerFile: 1_000,
    writeDelay: 20_000,
    manualSave: false,
  }
);

export const players = await createStore(
  "player",
  () => ({
    id: "",
    cookieId: "",
    lastLogin: 0,
    name: "",
    entity: "",
    position: [0, 0, 0],
    direction: [0, 0, 0],
  }),
  {
    maxPerFile: 1000,
    writeDelay: 5_000,
    manualSave: false,
  }
);

export const actions = await createStore(
  "actions",
  () => ({
    actor: "",
    position: [0, 0, 0],
    direction: [0, 0, 0],
    type: "",
    time: 0,
    target: "",
  }),
  {
    maxPerFile: 1000,
    manualSave: true,
  }
);

export const chunks = await createStore(
  "chunks",
  () => ({
    position: [0, 0, 0],
    data: "",
    players: [""],
  }),
  {
    maxPerFile: 1000,
    manualSave: true,
  }
);
