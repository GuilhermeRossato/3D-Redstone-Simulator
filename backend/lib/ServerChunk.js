
import fs from 'fs';
import { getStorageObjectFilePath } from "./primitives/StorageObjectStore.js";
import { getBlockNamingId, registerBlockNamingData } from "./blocks/BlockNamingStorage.js";
import {
  appendServerChunkChanges,
  clearServerChunkChanges,
  loadServerChunkChanges,
  loadServerChunkState,
  writeServerChunkState,
} from "./ServerChunkStore.js";
import { connectedPlayers } from './ServerRegion.js';

let unchanged_log = 64;
const saved_event_limit = 64;
const unsaved_event_limit = 128;
const unsaved_time_limit = 500;

let sampleState = {
  cx: 0, cy: 0, cz: 0,
  blocks: {},
  fileSize: 0,
};

export const serverChunkRecord = {};

/**
 * @param {any} event
 * @returns {event is {type: string, x: number, y: number, z: number, id?: string | number}} Returns `true` if the input matches the expected type, otherwise `false`.
 */
function isSetBlockEvent(event) {
  if (event && typeof event === 'object' && event.type === 'set' && typeof event.x === "number" && typeof event.y === "number" && typeof event.z === "number") {
    return true;
  }
  return false;
}

const checkEvent = {
  isSetBlock: isSetBlockEvent,
}

/**
 * @param {any} obj
 * @param {any} event
 * @returns {Boolean} Whether the event changed the object
 */
function applyServerChunkEvent(obj, event) {
  if (checkEvent.isSetBlock(event)) {
    if (event.id) {
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
      console.log('Set block', event.x, event.y, event.z, 'event:', event.id);
      obj.blocks[event.y][event.x][event.z] = event.id;
    } else {
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
      console.log('Remove block', event.x, event.y, event.z, 'event');
      delete obj.blocks[event.y][event.x][event.z];
      if (Object.keys(obj.blocks[event.y][event.x]).length === 0) {
        delete obj.blocks[event.y][event.x];
        if (Object.keys(obj.blocks[event.y]).length === 0) {
          delete obj.blocks[event.y];
        }
      }
    }
    return true;
  }
  throw new Error(`Unhandled chunk event: ${JSON.stringify(event)}`);
}

export class ServerChunk {
  constructor(cx = 0, cy = 0, cz = 0) {
    this.id = `c${cy | 0}/${cx | 0}x${cz | 0}`;
    this.cx = cx | 0;
    this.cy = cy | 0;
    this.cz = cz | 0;
    this.saveTimer = null;
    this.eventCount = 0;
    this.saved = 0;
    this.loaded = 0;
    this.appended = 0;
    this.state = undefined;
    this.unsaved = [];
    this.flush = this.flush.bind(this);
    if (serverChunkRecord[this.id]) {
      console.log('Warning: ServerChunk already exists for id', this.id);
    }
    serverChunkRecord[this.id] = this;
  }

  /**
   * 
   * @param {number} cx  The chunk x coordinate (absolute position divided by 16)
   * @param {number} cy  The chunk y coordinate (absolute position divided by 16)
   * @param {number} cz  The chunk z coordinate (absolute position divided by 16)
   */
  static get(cx, cy, cz) {
    const id = `c${Math.floor(cx)}/${Math.floor(cy)}x${Math.floor(cz)}`;
    if (!serverChunkRecord[id]) {
      serverChunkRecord[id] = new ServerChunk(cx, cy, cz);
    }
    return serverChunkRecord[id];
  }

  existsSync() {
    if (!this.id) {
      throw new Error("Chunk ID is not set. Cannot check existence.");
    }
    if (this.state && this.state.fileSize > 0) {
      return true;
    }
    return fs.existsSync(getStorageObjectFilePath("chunks", this.id, false));
  }

  async exists() {
    if (this.state && this.state.fileSize > 0) {
      return true;
    }
    try {
      this.state = await loadServerChunkState(this.id, sampleState);
      if (this.state.entities) {
        delete this.state.entities;
      }
      if (this.state && this.state.fileSize > 0) {
        return true;
      }
    } catch (err) {
      console.error(`Failed to load chunk state for ${this.id}:`, err);
    }
    return false;
  }

  /**
   * Creates an instance of a server chunk from the given coordinates, string, or object.
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
      if (serverChunkRecord[cx]) {
        return serverChunkRecord[cx];
      }
      if ((cx.startsWith("b") || cx.startsWith("c")) && cx.includes("/") && cx.includes("x")) {
        cx = cx.substring(1).replace("/", ",").replace("x", ",");
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
      cx.length === 3 &&
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
    if (!this.loaded) {
      await this.load();
    }
    if (!event.time) {
      event.time = Date.now();
    }
    if (typeof event.x === 'number') { event.x -= (this.cx * 16); }
    if (typeof event.y === 'number') { event.y -= (this.cy * 16); }
    if (typeof event.z === 'number') { event.z -= (this.cz * 16); }
    if (event.type === 'set' && typeof event.id === 'string' && event.id && !event.id.includes(':')) {
      const id = await getBlockNamingId(event.id);
      if (id) {
        event.id = id;
      } else {
        const result = await registerBlockNamingData({ key: event.id });
        if (!result?.id) {
          throw new Error(`Failed to create new block type with key "${event.id}"`);
        }
        event.id = result.id;
      }
    }
    if (!applyServerChunkEvent(this.state, event)) {
      console.log('Event did not change chunk state:', event.pose);
      return event;
    }
    const others = Object.values(connectedPlayers).filter((ctx) => ctx?.entity?.id !== event.id);
    if (others.length) {
      // console.log('Broadcasting',event.player,'event to', others.length, 'connected players:', event);
      for (const ctx of others) {
        const distance = ctx.region.distance(this);
        console.log(`Evaluating`, event.type, `broadcast to player ${ctx.player.id} from "${this.id}" in region "${ctx.region.id}" with distance ${distance}`);
        if (distance <= 2) {
          ctx.send(event);
        }
      }
    }
    this.unsaved.push(event);
    if (event.persist === false) {
      return event;
    }
    if (immediate || this.unsaved.length > unsaved_event_limit) {
      await this.flush();
    } else if (!this.saveTimer) {
      this.saveTimer = setTimeout(this.flush, unsaved_time_limit);
    }
    return event;
  }

  async set(x, y, z, id) {
    return await this.add({ x, y, z, id, type: id ? "set" : "remove" });
  }

  static async flushAll() {
    for (const chunk of Object.values(serverChunkRecord)) {
      if (!chunk.loaded && !chunk.unsaved.length && !chunk.eventCount) {
        continue;
      }
      await chunk.flush();
    }
  }
  /**
   * Write the changes to disk
   */
  async flush() {
    if (this.flushing) {
      console.log('Flush already in progress for chunk', this.id);
      return this.flushPromise;
    }

    this.flushing = true;
    this.flushPromise = (async () => {
      try {
        if (this.saveTimer) {
          clearTimeout(this.saveTimer);
          this.saveTimer = null;
        }
        if (!this.loaded) {
          await this.load();
        }
        if ((this.state.fileSize === 0 && this.unsaved.length) || this.unsaved.length + this.eventCount > saved_event_limit) {
          console.log(
            "Saving full chunk state",
            [this.id],
            "with",
            this.unsaved.length + this.eventCount,
            "events"
          );
          this.state.cx = this.cx;
          this.state.cy = this.cy;
          this.state.cz = this.cz;
          this.state.fileSize = await writeServerChunkState(this.id, this.state);
          await clearServerChunkChanges(this.id);
          this.saved = Date.now();
          this.unsaved = [];
          this.eventCount = 0;
        } else if (this.unsaved.length) {
          console.log(
            "Appending chunk changes",
            [this.id],
            "with",
            this.unsaved.length,
            "events"
          );
          await appendServerChunkChanges(this.id, this.unsaved);
          this.appended = Date.now();
          this.eventCount += this.unsaved.length;
          this.unsaved = [];
        } else {
          console.log('No changes to flush for chunk', this.id);
        }
      } catch (err) {
        console.log('Failed to flush chunk', this.id, 'with', this.unsaved.length, 'unsaved events');
        throw err;
      } finally {
        this.flushing = false;
        this.flushPromise = null;
      }
    })();

    return this.flushPromise;
  }

  getTimeSinceLoad() {
    return Date.now() - this.loaded;
  }


  async load(forceRefresh = false) {
    if (this.loaded && this.state && !forceRefresh) {
      console.log('Chunk', this.id, 'already loaded, skipping load');
      return this;
    }
    this.state = await loadServerChunkState(this.id, sampleState);
    if (this.state.entities) {
      delete this.state.entities;
    }
    const isEmpty = this.state === sampleState;
    if (isEmpty) {
      this.state.cx = this.cx;
      this.state.cy = this.cy;
      this.state.cz = this.cz;
      sampleState = JSON.parse(JSON.stringify(sampleState));
    }
    const changes = await loadServerChunkChanges(this.id);
    if (isEmpty && changes.length) {
      console.log(`Loaded chunk ${this.id} with ${changes.length} changes, but no state found.`);
    }
    for (const event of changes) {
      try {
        if (event?.type==="move"||event?.type==='spawn') continue;
        //console.log('Applying event to chunk', this.id, ':', event.x, event.y, event.z, event.id, event.type);
        if (!applyServerChunkEvent(this.state, event)) {
          ((unchanged_log--)>0)&&console.log('Event of type',event.type,'did not change chunk state:', event);
          continue;
        }
      } catch (err) {
        console.error(`Error applying event to chunk ${this.id}:`, err, event);
        continue;
      }
    }
    this.eventCount = changes.length;
    this.loaded = Date.now();
    return this;
  }

  static fromAbsolute(x, y = undefined, z = undefined) {
    if (
      x &&
      typeof x === 'object' &&
      x.pose instanceof Array &&
      x.pose.length >= 3 &&
      y === undefined &&
      z === undefined
    ) {
      z = x.pose[2];
      y = x.pose[1];
      x = x.pose[0];
    }
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
    const cx = Math.floor(x / 16);
    const cy = Math.floor(y / 16);
    const cz = Math.floor(z / 16);
    return ServerChunk.from(cx, cy, cz);
  }
}
