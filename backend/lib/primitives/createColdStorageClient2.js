import { backendPath } from "../init.js";
import { sfs } from "../../utils/sfs.js";

/**
 * @param {string} type
 * @param {boolean} [singleFile]
 * @param {boolean} [canCreate]
 * @returns {Promise<any>}
 */
export async function createColdStorageClient(
  type = "",
  singleFile = undefined,
  canCreate = false
) {
  const root = `${backendPath}/data/c-${type}${singleFile ? ".json" : ""}`;
  const s = await sfs.stat(root);
  if (singleFile === undefined) {
    singleFile = s.isFile() ? true : s.isDirectory() ? false : undefined;
  }
  if (singleFile === true && !s.isFile()) {
    if (s.isDirectory()) {
      throw new Error(
        `Cold storage root for ${JSON.stringify(type)} is a directory: ${root}`
      );
    }
    if (!canCreate) {
      throw new Error(
        `Cold storage root for ${JSON.stringify(
          type
        )} not found (expected a file): ${root}`
      );
    }
    await sfs.writeFile(
      type,
      JSON.stringify({
        created: Math.floor(Date.now()),
      })
    );
  } else if (singleFile === false && !s.isDirectory()) {
    if (s.isFile()) {
      throw new Error(
        `Cold storage root for ${JSON.stringify(type)} is a file: ${root}`
      );
    }
    if (!canCreate) {
      throw new Error(
        `Cold storage root for ${JSON.stringify(
          type
        )} not found (expected a directory): ${root}`
      );
    }
    await sfs.mkdir(root);
  }
  if (singleFile === true) {
    return createSingleFileStorage(type);
  } else if (singleFile === false) {
    return createMultipleFileStorage(type);
  } else {
    throw new Error("Unhandled arguments");
  }
}

/**
 * Creates a single file storage object for a given type.
 * @param {string} type - The type used to generate the storage root path.
 * @returns {{
 *    latest: {
 *      data: any,
 *      time: number
 *      source: "" | "load" | "save"
 *    },
 *    get: (id: string, strict?: boolean, reload?: boolean) => Promise<any>,
 *    load: (reload?: boolean) => Promise<any>,
 *    save: (data: any) => Promise<any>
 * }} - A single file storage object with methods to get, load, and save data.
 */
export function createSingleFileStorage(type) {
  const root = `${backendPath}/data/c-${type}.json`;
  return {
    latest: {
      data: undefined,
      time: NaN,
      source: "",
    },
    async get(id, strict = false, reload = false) {
      const stat = await sfs.stat(root);
      if (reload || !(Math.floor(stat.mtimeMs) <= this.latest.time)) {
        await this.load();
      }
      const value = this.latest.data[id];
      if (strict && !value && value !== 0 && value !== false && value !== "") {
        throw new Error(
          `Cold storage ${JSON.stringify(
            type
          )} has no entry with id: ${JSON.stringify(id)}`
        );
      }
      return value;
    },
    async load(reload = false) {
      const stat = await sfs.stat(root);
      if (reload && Math.floor(stat.mtimeMs) <= this.latest.time) {
        return this.latest.data;
      }
      const text = await sfs.readTextFile(root);
      this.latest.data = JSON.parse(text || "{}");
      this.latest.time = Date.now();
      this.latest.source = "load";
      return this.latest.data;
    },
    async save(data) {
      this.latest.data = data;
      this.latest.time = Date.now();
      this.latest.source = "save";
      await sfs.writeFile(root, JSON.stringify(data, null, "  "), "utf-8");
      const stat = await sfs.stat(root);
      this.latest.time = Math.floor(stat.mtimeMs);
      return this.latest.data;
    },
  };
}

/**
 * Creates a multiple file storage object for a given type.
 * @param {string} type - The type used to generate the storage root path.
 * @returns {{
 *    latest: Record<string, {
 *      data: any,
 *      time: number
 *      source: "" | "load" | "save"
 *    }>,
 *    get: (name: string, prop:string, strict?: boolean, reload?: boolean) => Promise<any>,
 *    list: () => Promise<string[]>,
 *    load: (name: string, reload?: boolean) => Promise<any>,
 *    save: (name: string, data: any) => Promise<any>
 * }} - A multiple file storage object with methods to get, list, load, and save data.
 */
export function createMultipleFileStorage(type) {
  const root = `${backendPath}/data/c-${type}`;
  return {
    latest: {},
    async get(name, prop, strict = false, reload = false) {
      const stat = await sfs.stat(`${root}/${name}.json`);
      if (
        reload ||
        !this.latest[name] ||
        !(Math.floor(stat.mtimeMs) <= this.latest[name].time)
      ) {
        await this.load(name, true);
      }
      if (this.latest[name].data?.[prop] === undefined && strict) {
        throw new Error(
          `Cold storage ${JSON.stringify(
            type
          )} has no entry with name: ${JSON.stringify(name)}`
        );
      }
      return this.latest[name]?.data?.[prop];
    },
    async list(cached = false) {
      if (cached) {
        const list = Object.keys(this.latest);
        if (list.length > 0) {
          return list;
        }
      }
      const list = await sfs.readdir(root);
      return list.flatMap((o) =>
        !o.startsWith("_") && o.endsWith(".json")
          ? [o.substring(0, o.length - 5)]
          : []
      );
    },
    async load(name, reload = false, strict = false) {
      const stat = await sfs.stat(`${root}/${name}.json`);
      if (
        !reload &&
        this.latest[name] &&
        stat.isFile() &&
        Math.floor(stat.mtimeMs) <= this.latest[name].time
      ) {
        return this.latest[name].data;
      }
      const text = await sfs.readTextFile(root);
      if (!text) {
        if (strict) {
          throw new Error(
            `Cold storage ${JSON.stringify(
              type
            )} has no entry with name: ${JSON.stringify(
              name
            )} at "${root}/${name}.json"`
          );
        }
        return {};
      }
      if (!this.latest[name]) {
        this.latest[name] = { data: undefined, time: NaN, source: "" };
      }
      this.latest[name].data = JSON.parse(text || "{}");
      this.latest[name].time = Date.now();
      this.latest[name].source = "load";
      return this.latest[name].data;
    },
    async save(name, data) {
      if (data !== null) {
        if (!this.latest[name]) {
          this.latest[name] = { data: undefined, time: NaN, source: "" };
        }
        this.latest[name].data = data;
        this.latest[name].time = Date.now();
        this.latest[name].source = "save";
        const text = JSON.stringify(data, null, "  ");
        await sfs.writeFile(`${root}/${name}.json`, text, "utf-8");
      }
      const stat = await sfs.stat(`${root}/${name}.json`);
      if (data === null) {
        if (stat.isFile()) {
          await sfs.unlink(`${root}/${name}.json`);
        }
        delete this.latest[name];
        return null;
      }
      this.latest[name].time = Math.ceil(stat.mtimeMs);
      return data;
    },
  };
}
