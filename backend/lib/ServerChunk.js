import fs from 'fs';
import { getStorageObjectFilePath } from "./primitives/StorageObjectStore.js";
import { getBlockNamingId, registerBlockNamingData } from "./blocks/BlockSharedStorage.js";
import {
  appendServerChunkChanges,
  clearServerChunkChanges,
  loadServerChunkChanges,
  loadServerChunkState,
  writeServerChunkState,
} from "./ServerChunkStore.js";
import { connectedPlayerEntities } from './ServerRegion.js';
import { createServerStore } from './ServerStore.js';
import { convertBlockListToBlockRecord } from './convertBlockListToBlockRecord.js';

const unsaved_event_limit = 128;
const unsaved_time_limit = 500;

let sampleState = {
  id: '',
  blocks: {},
  fileSize: 0,
};

export const serverChunkRecord = {};

/**
 * @param {any} event
 * @returns {event is {type: string, x: number, y: number, z: number, b?: string | number, id?: string | number}} Returns `true` if the input matches the expected type, otherwise `false`.
 */
function isSetBlockEvent(event) {
  if (event && typeof event === 'object' && event.type === 'set' && typeof event.x === "number" && typeof event.y === "number" && typeof event.z === "number") {
    if (typeof event.b !== "number" && typeof event.id === "number") {
      event.b = event.id;
    }
    if (typeof event.b === "number") {
      return true;
    }
  }
  return false;
}

/**
 * @param {any} event
 * @returns {event is {type: string, x: number, y: number, z: number, block?: undefined, id?: string | number, time?: number}} Returns `true` if the input matches the expected type, otherwise `false`.
 */
function isRemoveBlockEvent(event) {
  if (
    event &&
    typeof event === 'object' &&
    event.type === 'remove' &&
    typeof event.x === 'number' &&
    typeof event.y === 'number' &&
    typeof event.z === 'number'
  ) {
    return true;
  }
  return false;
}

const checkEvent = {
  isSetBlock: isSetBlockEvent,
  isRemoveBlock: isRemoveBlockEvent,
}

/**
 * @param {any} obj
 * @param {any} event
 * @returns {Boolean} Whether the event changed the object
 */
function applyServerChunkEvent(obj, event) {
  if (typeof obj.cx !== "number" || typeof obj.cy !== "number" || typeof obj.cz !== "number") {
    if (obj.id) {
      const c = (obj.id.match(/-?\d+/g) || []).map(i => parseInt(i));
      if (c.length === 3 && c.every(i => !isNaN(i))) {
        obj.cx = c[0];
        obj.cy = c[1];
        obj.cz = c[2];
      }
    } else {
      throw new Error("Chunk coordinates are not set. Cannot apply event.");
    }
  }
  const rx = event.x - (obj.cx * 16);
  const ry = event.y - (obj.cy * 16);
  const rz = event.z - (obj.cz * 16);
  if (rx < 0 || rx >= 16 || ry < 0 || ry >= 16 || rz < 0 || rz >= 16) {
    throw new Error(`Event coordinates are out of bounds for this chunk. Event at (${event.x},${event.y},${event.z}) but chunk is at (${obj.cx},${obj.cy},${obj.cz})`);
  }

  if (checkEvent.isSetBlock(event)) {
    if (event.id) {
      if (!obj.blocks) {
        obj.blocks = {};
      }
      if (!obj.blocks[ry]) {
        obj.blocks[ry] = {};
      }
      if (!obj.blocks[ry][rx]) {
        obj.blocks[ry][rx] = {};
      }
      if (obj.blocks[ry][rx][rz] === event.b) {
        return false;
      }
      console.log('Set block', rx, ry, rz, 'event:', event.b);
      obj.blocks[ry][rx][rz] = event.b;
    } else {
      if (!obj.blocks) {
        return false;
      }
      if (!obj.blocks[ry]) {
        return false;
      }
      if (!obj.blocks[ry][rx]) {
        return false;
      }
      if (!obj.blocks[ry][rx][rz]) {
        return false;
      }
      console.log('Remove block', rx, ry, rz, 'event');
      delete obj.blocks[ry][rx][rz];
      if (Object.keys(obj.blocks[ry][rx]).length === 0) {
        delete obj.blocks[ry][rx];
        if (Object.keys(obj.blocks[ry]).length === 0) {
          delete obj.blocks[ry];
        }
      }
    }
    return true;
  }
  if (checkEvent.isRemoveBlock(event)) {
    console.log('Remove block event detected:', JSON.stringify(event).substring(0, 16), 'length:', JSON.stringify(event).length);

    if (!obj.blocks) {
      return false;
    }
    if (!obj.blocks[ry]) {
      return false;
    }
    if (!obj.blocks[ry][rx]) {
      return false;
    }
    if (!obj.blocks[ry][rx][rz]) {
      return false;
    }
    console.log('Remove block', rx, ry, rz, 'event');
    delete obj.blocks[ry][rx][rz];
    if (Object.keys(obj.blocks[ry][rx]).length === 0) {
      delete obj.blocks[ry][rx];
      if (Object.keys(obj.blocks[ry]).length === 0) {
        delete obj.blocks[ry];
      }
    }
    return true;
  }
  throw new Error(`Unhandled chunk event: ${JSON.stringify(event)}`);
}

const chunkStore = createServerStore({
  typeName: 'chunk',
  unsaved_event_limit,
  unsaved_time_limit,
  sampleState,
  loadState: async (id, sample) => await loadServerChunkState(id, sample),
  loadChanges: async (id) => await loadServerChunkChanges(id),
  writeState: async (id, state) => await writeServerChunkState(id, state),
  appendChanges: async (id, changes) => await appendServerChunkChanges(id, changes),
  clearChanges: async (id) => await clearServerChunkChanges(id),
  applyEvent: applyServerChunkEvent,
  unserializeState: (state, instance) => {
    //if (state.blockList && state.blockList instanceof Array) {
    //  state.blocks = convertBlockListToBlockRecord(state.blockList);
    //}
    return state;
  },
  serializeState: (stateClone, instance) => {
    // remove coordinates before write
    stateClone.blockList = Object.entries(stateClone.blocks).map(([x, a]) => Object.entries(a).map(([y, b]) => Object.entries(b).map(([z, id]) => `x${x}y${y}z${z}i${id}`)).flat()).flat();
    //delete stateClone.blocks;
    delete stateClone.cx;
    delete stateClone.cy;
    delete stateClone.cz;
  },
});

export class ServerChunk {
  constructor(cx = 0, cy = 0, cz = 0) {
    this.id = `c${cy | 0}/${cx | 0}x${cz | 0}`;
    this.cx = cx | 0;
    this.cy = cy | 0;
    this.cz = cz | 0;
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
      this.state = await loadServerChunkState(this.id, { fileSize: 0 });
      if (this.state && this.state.fileSize > 0) {
        return true;
      }
    } catch (err) {
      console.error(`Failed to load chunk state for ${this.id}:`, err);
    }
    return false;
  }

  async add(event, immediate = false) {
    if (!event.time) {
      event.time = Date.now();
    }
    if (!this.loaded) {
      await this.load();
    }
    const b = event.b;
    if (event.type === 'set' && typeof b === 'string' && b && !b.includes(':')) {
      const id = await getBlockNamingId(b);
      if (id) {
        event.b = id;
      } else {
        const result = await registerBlockNamingData({ key: b });
        if (!result?.id) {
          throw new Error(`Failed to create new block type with key "${b}"`);
        }
        event.b = result.id;
      }
    }
    if (!applyServerChunkEvent(this.state, event)) {
      console.log('Event did not change chunk state:', event.pose);
      return event;
    }
    const others = Object.values(connectedPlayerEntities).filter((ctx) => ctx?.entity?.id !== b);
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
    return await chunkStore.add(this, event, immediate);;
  }

  async set(x, y, z, id) {
    return await this.add({ x, y, z, b: id, type: id ? "set" : "remove" });
  }

  getTimeSinceLoad() {
    return Date.now() - this.loaded;
  }

  static async flushAll() {
    for (const chunk of Object.values(serverChunkRecord)) {
      if (!chunk.loaded && !chunk.unsaved.length && !chunk.eventCount) {
        continue;
      }
      await chunk.flush();
    }
  }

  async flush() {
    return await chunkStore.flush(this);
  }

  async load(forceRefresh = false) {
    console.log('Loading chunk', this.id);
    const loaded = await chunkStore.load(this, forceRefresh);
    if (this.cx === 0 && this.cy === 0 && this.cz === 0) {
      console.log('Loaded chunk', this.id, 'with', Object.keys(this.state.blocks || {}).length, 'columns of blocks');
    }
    return loaded;
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
}
