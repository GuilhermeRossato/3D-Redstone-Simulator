import fs from "fs";
import { backendPath } from "./init.js";

/**
 * Converts a world position dimension into its chunk position equivalent
 * @param {number} v
 */
function worldPositionToChunk(v) {
  return Math.floor(v / 16);
}

const cache = {};
const map = new Map();

function apply(obj, path, value) {
  const list = path.split(".");
  const last = list.pop();
  let node = obj.state;
  for (const key of list) {
    node = node[key] || (node[key] = {});
  }
  if (value === undefined || value === null) {
    delete node[last];
  } else {
    node[last] = value;
  }
  return obj;
}

const events_count_limit = 64;
const unsaved_count_limit = 32;
const unsaved_time_limit = 5000;

const dirty_list = [];

export class ServerChunk {
  constructor(cx = 0, cy = 0, cz = 0, id = "") {
    this.id = id && id.startsWith("b") ? id : `b${cy | 0}/${cx | 0}x${cz | 0}`;
    this.cx = cx | 0;
    this.cy = cy | 0;
    this.cz = cz | 0;
    this.path = `${backendPath}/data/chunks/${this.id}.json`;
    this.dirty = 0;
    this.save = 0;
    this.load = 0;
    this.last = 0;
    this.state = undefined;
    this.changes = undefined;
    this.unsaved = [];

    cache[this.id] = this;
  }

  static from(...args) {
    if (args.length === 1 && args[0] instanceof ServerChunk) {
      return args[0];
    }
    let cx, cy, cz;
    if (
      args.length === 3 &&
      (typeof args[0] === "string" || typeof args[0] === "number")
    ) {
      cx = args[0];
      cy = args[1];
      cz = args[2];
    } else if (args.length === 1 && args[0] && typeof args[0] === "object") {
      if (typeof args[0].cx === "number" || typeof args[0].cx === "string") {
        cx = args[0].cx;
        cy = args[0].cy;
        cz = args[0].cz;
      } else if (typeof args[0].id === "string" && args[0].id.startsWith("b")) {
        args = args[0].id.substring(1).replace("/", "x").split("x");
        cx = args[0];
        cy = args[1];
        cz = args[2];
      } else if (
        typeof args[0].x === "number" &&
        typeof args[0].z === "number"
      ) {
        cx = args[0].x / 16;
        cy = args[0].y / 16;
        cz = args[0].z / 16;
      } else if (
        args[0] instanceof Array &&
        args[0].length === 3 &&
        (typeof args[0][0] === "number" || typeof args[0][0] === "string")
      ) {
        cx = args[0][0];
        cy = args[0][1];
        cz = args[0][2];
      }
    }
    if (
      cx === undefined ||
      cy === undefined ||
      cz === undefined ||
      cx === null ||
      cy === null ||
      cz === null
    ) {
      throw new Error("Invalid arguments");
    }
    if (typeof cx === "string") {
      cx = parseInt(cx);
    }
    if (typeof cy === "string") {
      cy = parseInt(cy);
    }
    if (typeof cz === "string") {
      cz = parseInt(cz);
    }
    if (isNaN(cx) || isNaN(cy) || isNaN(cz)) {
      throw new Error("Invalid arguments");
    }
    const id = `b${cx | 0}/${cy | 0}x${cz | 0}`;
    if (!id || id.length < 6 || id.includes("NaN")) {
      throw new Error("Invalid id from arguments");
    }
    if (cache[id]) {
      return cache[id];
    }
    const chunk = new ServerChunk(cx, cy, cz, id);
    cache[id] = chunk;
    return chunk;
  }

  async add(event) {
    if (event.path) {
      apply(this, event.path, event.value);
    } else if (event.value) {
      this.state = event.value;
    }
    this.unsaved.push(event);

    this.verify(event.time || (event.time = Date.now()));

    return event;
  }

  /**
   * Verify if data must be written to disk.
   */
  verify(time = 0) {
    if (
      this.unsaved.length &&
      (this.unsaved.length >= unsaved_count_limit ||
        (time || Date.now()) - this.unsaved[0].time > unsaved_time_limit)
    ) {
      if (!this.dirty) {
        this.dirty = time;
        dirty_list.push(this);
      }
      return true;
    }
    return false;
  }

  async persistUpdates() {
    if (this.unsaved.length + this.changes.length > events_count_limit) {
      return limit;
    }
    const now = Date.now();
    let i;
    for (i = 0; i < this.unsaved.length; i++) {
      if (limit > 0 && i >= limit) {
        break;
      }
      if (this.unsaved[i].time - now > unsaved_time_limit) {
        continue;
      }
      if (this.unsaved.length - i >= events_count_limit) {
        continue;
      }
      break;
    }
    if (i > 0) {
      const list = this.unsaved
        .splice(0, limit > 0 && i >= limit ? limit : i)
        .map((e) => JSON.stringify(e) + ",");
      await fs.promises.appendFile(this.path, list.join("\n") + "\n", "utf-8");
      if (limit > 0 && limit < i) {
        return;
      }
      if (limit > 0) {
        limit -= i;
      }
    }
    return limit;
  }

  async load() {
    for (const key of ["state", "changes"]) {
      try {
        const isArray = this[key] instanceof Array;
        const text = await fs.promises.readFile(
          this.path + (isArray ? "l" : ""),
          "utf-8"
        );
        if (text) {
          this[key] = JSON.parse(
            isArray ? `[${text.substring(0, text.lastIndexOf(","))}]` : text
          );
        }
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }
    }
    for (const event of this.changes) {
      if (event.path) {
        apply(this, event.path, event.value);
      } else if (event.value) {
        this.state = event.value;
      }
    }
    return this;
  }

  static loadByAbsolute(x, y, z) {
    const cx = (x / 16) | 0;
    const cy = (y / 16) | 0;
    const cz = (z / 16) | 0;
    return ServerChunk.loadByPos(cx, cy, cz);
  }

  static async set(x, y, z, i) {}

  static async saveFromRecord(record, entities) {
    const set = new Set();
    for (const y in record) {
      for (const x in record[y]) {
        for (const z in record[y][x]) {
          set.add(record[y][x][z]);
        }
      }
    }
  }
}
