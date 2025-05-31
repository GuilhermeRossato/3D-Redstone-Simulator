import {
  appendServerChunkChanges,
  clearServerChunkChanges,
  loadServerChunkChanges,
  loadServerChunkState,
  writeServerChunkState,
} from "./ServerChunkStore.js";

const saved_event_limit = 2;
const unsaved_event_limit = 2;
const unsaved_time_limit = 500;

const sampleState = {
  blocks: {},
  inside: [],
  fileSize: 0,
};
const cache = {};

/**
 * @param {any} obj
 * @param {any} event
 * @returns {Boolean} Whether the event changed the object
 */
function applyServerChunkEvent(obj, event) {
  if (event.type === "spawn" && event.en)
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
      if (
        obj.inside.some(
          (e) => (e.id && e.id === id) || (e.entityId && e.entityId === id)
        )
      ) {
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

export class ServerChunk {
  constructor(cx = 0, cy = 0, cz = 0) {
    this.id = `b${cy | 0}/${cx | 0}x${cz | 0}`;
    this.cx = cx | 0;
    this.cy = cy | 0;
    this.cz = cz | 0;
    this.saveTimer = null;
    this.eventCount = 0;
    this.written = 0;
    this.loaded = 0;
    this.state = undefined;
    this.unsaved = [];
    //this.path = `${backendPath}/data/chunks/${this.id}.json`;
    this.flush = this.flush.bind(this);
  }

  /**
   * 
   * @param {number} cx  The chunk x coordinate (absolute position divided by 16)
   * @param {number} cy  The chunk y coordinate (absolute position divided by 16)
   * @param {number} cz  The chunk z coordinate (absolute position divided by 16)
   */
  static get(cx, cy, cz) {
    const id = `c${cx | 0}/${cy | 0}x${cz | 0}`;
    if (!cache[id]) {
      cache[id] = new ServerChunk(cx, cy, cz);
    }
    return cache[id];
  }

  async exists() {}

  /**
   * Creates an instance of a server chunk (without creating it on the database if it doesnt exist)
   *
   * @param {string | number | ServerChunk | number[]} cx
   * @param {number} [cy]
   * @param {number} [cz]
   * @returns {ServerChunk}
   */
  static from(cx, cy, cz) {
    if (cx instanceof ServerChunk && !cy && !cz) {
      return cx;
    }
    if (typeof cx === "string" && cy === undefined && cz === undefined) {
      if (cx.startsWith("b") && cx.includes("/") && cx.includes("x")) {
        cx = cx.replace("b", "").replace("/", ",").replace("x", ",");
      }
      if (cx.includes(",")) {
        const a = cx.split(",");
        cx = parseFloat(a[0]);
        cy = parseFloat(a[1]);
        cz = parseFloat(a[2]);
      }
    }
    if (
      cx instanceof Array &&
      (cx.length === 3 || cx.length === 4) &&
      !cy &&
      !cz
    ) {
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
    if (typeof cx !== "number" || isNaN(cx) || isNaN(cy) || isNaN(cz)) {
      throw new Error("Invalid arguments");
    }
    return ServerChunk.get(cx, cy, cz);
  }

  async add(event, immediate = false) {
    if (this.flushing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.loaded) {
      await this.load();
    }
    if (!event.time) {
      event.time = Date.now();
    }
    if (!this.state) {
      throw new Error("State not loaded");
    }
    console.log("Adding event", event, "to", this.id);
    applyServerChunkEvent(this.state, event);
    this.unsaved.push(event);
    if (event.persist) {
      if (immediate || this.unsaved.length > unsaved_event_limit) {
        await this.flush();
      } else if (!this.saveTimer) {
        this.saveTimer = setTimeout(this.flush, unsaved_time_limit);
      }
    }
    return event;
  }

  async set(x, y, z, id) {
    return await this.add({ x, y, z, id, type: id ? "set" : "remove" });
  }

  /**
   * Write the changes to disk
   */
  async flush() {
    this.flushing = true;
    try {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
      if (!this.loaded) {
        await this.load();
      }
      const now = Date.now();
      const events = [];
      const updated = this.unsaved.filter((e, i, arr) => {
        const remaining = arr.length - 1 - i;
        if (remaining > unsaved_event_limit) {
          console.log("Consolidating", i);
          if (e.persist !== false) {
            events.push(e);
          }
          return false;
        }
        if (e.time < now - unsaved_time_limit) {
          console.log("Consolidating", i);
          if (e.persist !== false) {
            events.push(e);
          }
          return false;
        }
        return true;
      });
      if (events.length === 0) {
        console.log("Nothing to flush to chunk", [this.id]);
        this.flushing = false;
        return;
      }
      const total = this.eventCount + events.length;
      if (total > saved_event_limit) {
        console.log(
          "Saving full chunk state",
          [this.id],
          "with",
          total,
          "events"
        );
        this.state.cx = this.cx;
        this.state.cy = this.cy;
        this.state.cz = this.cz;
        await writeServerChunkState(this.id, this.state);
        await clearServerChunkChanges(this.id);
        this.unsaved = [];
        this.eventCount = 0;
      } else {
        console.log(
          "Appending chunk changes",
          [this.id],
          "with",
          total,
          "events"
        );
        await appendServerChunkChanges(this.id, events);
        this.eventCount += events.length;
        this.unsaved = updated;
      }
      this.flushing = false;
    } catch (err) {
      this.flushing = false;
      throw err;
    }
  }

  getTimeSinceLoad() {
    return Date.now() - this.loaded;
  }

  getServerChunkEventsSince(time)

  async load() {
    this.state = await loadServerChunkState(this.id, sampleState);
    const changes = await loadServerChunkChanges(this.id);
    for (const event of changes) {
      applyServerChunkEvent(this.state, event);
    }
    this.eventCount = changes.length;
    this.loaded = Date.now();
    return this;
  }

  static fromAbsolute(x, y = undefined, z = undefined) {
    if (
      x instanceof Array &&
      x.length >= 3 &&
      y === undefined &&
      z === undefined
    ) {
      z = x[2];
      y = x[1];
      x = x[0];
    }
    const cx = (x / 16) | 0;
    const cy = (y / 16) | 0;
    const cz = (z / 16) | 0;
    return ServerChunk.from(cx, cy, cz);
  }
}
