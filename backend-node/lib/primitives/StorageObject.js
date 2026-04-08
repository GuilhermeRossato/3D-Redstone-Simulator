import {
  appendServerChunkChanges,
  clearServerChunkChanges,
  loadServerChunkChanges,
  loadServerChunkState,
  writeServerChunkState,
} from "../ServerChunkStore.js";

const sampleState = {
  cx: 0,
  cy: 0,
  cz: 0,
  blocks: {},
  inside: [],
};
const cache = {};

/**
 * @param {any} obj
 * @param {any} event
 * @returns {Boolean} Whether the event changed the object
 */
function applyServerChunkEvent(obj, event) {
  if (
    typeof event.x === "number" &&
    typeof event.y === "number" &&
    typeof event.z === "number"
  ) {
    if (
      typeof event.id === "number" &&
      (event.type === "set" ||
        event.type === "+" ||
        (event.type === undefined && event.id > 0))
    ) {
      if (!obj.blocks) {
        obj.blocks = {};
      }
      if (!obj.blocks[event.y]) {
        obj.blocks[event.y] = {};
      }
      if (!obj.blocks[event.y][event.x]) {
        obj.blocks[event.y][event.x] = {};
      }
      if (obj.blocks[event.y][event.x][event.z] === event.id) {
        return false;
      }
      obj.blocks[event.y][event.x][event.z] = event.id;
      return true;
    }
    if (
      event.type === "remove" ||
      event.type === "-" ||
      (event.type === undefined && event.id === 0)
    ) {
      if (!obj.blocks) {
        return false;
      }
      if (!obj.blocks[event.y]) {
        return false;
      }
      if (!obj.blocks[event.y][event.x]) {
        return false;
      }
      if (!obj.blocks[event.y][event.x][event.z]) {
        return false;
      }
      delete obj.blocks[event.y][event.x][event.z];
      if (Object.keys(obj.blocks[event.y][event.x]).length === 0) {
        delete obj.blocks[event.y][event.x];
        if (Object.keys(obj.blocks[event.y]).length === 0) {
          delete obj.blocks[event.y];
        }
      }
      return true;
    }
  }
  const id = event.entity?.id || event.entityId || event.id;
  if (id) {
    if (!obj.inside) {
      obj.inside = [];
    }
    if (event.type === "enter" || event.type === "+") {
      if (obj.inside.some((e) => e.id === id || e.entityId === id)) {
        return false;
      }
      const idx = obj.inside.findIndex((e) => (e.id || e.entityId) > id);
      const entity = event.entity ? event.entity : { id };
      if (idx === -1) {
        obj.inside.push(entity);
      } else {
        obj.inside.splice(idx, 0, entity);
      }
      return true;
    }
    if (event.type === "exit" || event.type === "-") {
      const idx = obj.inside.findIndex((e) => e.id === id || e.entityId === id);
      if (idx === -1) {
        return false;
      }
      obj.inside.splice(idx, 1);
      return true;
    }
    throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
  if (typeof event.path === "string") {
    const list = event.path.split(".");
    const last = list.pop();
    let node = obj.state;
    for (const key of list) {
      node = node[key] || (node[key] = {});
    }
    if (
      ["string", "number", "boolean"].includes(typeof event.value) &&
      node[last] === event.value
    ) {
      return false;
    }
    if (
      (event.value === undefined || event.value === null) &&
      node[last] === event.value
    ) {
      return false;
    }
    if (event.value === undefined || event.value === null) {
      delete node[last];
    } else {
      node[last] = event.value;
    }
    return true;
  }
  throw new Error(`Unknown event: ${JSON.stringify(event)}`);
}

const saved_event_limit = 128;
const unsaved_event_limit = 64;
const unsaved_time_limit = 5000;

export class ServerChunk {
  constructor(cx = 0, cy = 0, cz = 0) {
    this.id = `b${cy | 0}/${cx | 0}x${cz | 0}`;
    this.cx = cx | 0;
    this.cy = cy | 0;
    this.cz = cz | 0;
    this.saveTimer = null;
    //this.path = `${backendPath}/data/chunks/${this.id}.json`;
    this.eventCount = 0;
    this.written = 0;
    this.loaded = 0;
    this.state = undefined;
    this.unsaved = [];
    this.flush = this.flush.bind(this);
  }

  static from(cx, cy, cz) {
    if (cx instanceof ServerChunk && !cy && !cz) {
      return cx;
    }
    if (cx instanceof Array && cx.length === 3 && !cy && !cz) {
      cz = cx[2];
      cy = cx[1];
      cx = cx[0];
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
    if (!id || id.length < 6) {
      throw new Error("Invalid id from arguments");
    }
    if (!cache[id]) {
      cache[id] = new ServerChunk(cx, cy, cz);
    }
    return cache[id];
  }

  async add(event) {
    if (this.flushing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!this.loaded) {
      await this.load();
    }
    if (!event.time) {
      event.time = Date.now();
    }
    if (!this.saveTimer) {
      this.saveTimer = setTimeout(this.flush, unsaved_time_limit);
    }
    applyServerChunkEvent(this, event);
    this.unsaved.push(event);
    if (this.unsaved.length > unsaved_event_limit) {
      await this.flush();
    }
    return event;
  }

  async set(x, y, z, id) {
    return await this.add({x, y, z, id, type: id ? "set" : "remove"});
  }

  /**
   * Write the changes to disk
   * @param {number} [limit] - Limit the number of changes to write
   */
  async flush(limit = NaN) {
    this.flushing = true;
    try {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
      if (!this.loaded) {
        await this.load();
      }
      const cutoff = Math.min(
        this.unsaved.length,
        isNaN(limit) || limit < 0 ? this.unsaved.length : limit
      );
      const total = this.eventCount + cutoff;
      if (total > saved_event_limit) {
        await writeServerChunkState(this.id, this.state);
        await clearServerChunkChanges(this.id);
      } else {
        await appendServerChunkChanges(this.id, this.unsaved.splice(0, cutoff));
      }
      this.flushing = false;
    } catch (err) {
      this.flushing = false;
      throw err;
    }
  }

  async load(apply = true) {
    const res = {
      state: await loadServerChunkState(this.id, sampleState),
      changes: await loadServerChunkChanges(this.id),
    };
    for (const event of res.changes) {
      applyServerChunkEvent(res.state, event);
    }
    if (apply) {
      this.state = res.state;
      this.eventCount = res.changes.length;
      this.loaded = Date.now();
    }
    return res;
  }

  static fromAbsolute(x, y, z) {
    const cx = (x / 16) | 0;
    const cy = (y / 16) | 0;
    const cz = (z / 16) | 0;
    return ServerChunk.from(cx, cy, cz);
  }
}
