// @ts-check

import {
  appendServerRegionChanges,
  clearServerRegionChanges,
  loadServerRegionChanges,
  loadServerRegionState,
  writeServerRegionState,
} from "./ServerRegionStore.js";

const saved_event_limit = 64;
const unsaved_event_limit = 128;
const unsaved_time_limit = 500;

export const connectedPlayers = {};

export const serverRegionRecord = {};

let sampleState = {
  id: '',
  rx: 0,
  ry: 0,
  rz: 0,
  fileSize: 0,
  entities: [],
}

/**
 * @param {any} obj
 * @param {any} event
 * @returns {Boolean} Whether the event changed the object
 */
function applyServerRegionEvent(obj, event) {
  if (!obj.entities) {
    obj.entities = [];
  }
  const idx = obj.entities.findIndex((e) => e.entity === event.entity);
  const outside = [obj.rx, obj.ry, obj.rz].map((c, i) => event.pose[i] - c * 64).some(p => p < 0 || p > 64)
  if (idx === -1) {
    if (outside) {
      console.log('Exit event (already outside)');
      return false;
    } else {
      console.log('Enter event (entity entered)');
      event.entered = obj.id;
      obj.entities.push({ ...event, type: undefined, time: undefined, entered: event.time || Date.now() });
      return true;
    }
  } else {
    if (outside) {
      console.log('Exit event (entity moved outside)');
      obj.entities.splice(idx, 1);
      event.exited = obj.id;
      return true;
    } else {
      const deltas = obj.entities[idx].pose.map((a, i) => Math.abs(a - event.pose[i]));
      if (deltas.every((a, i) => a <= (i < 3 ? 0.02 : 0.001))) {
        console.log('Move event (unchanged)');
        return false;
      }
      console.log('Move event');
      event.pose.forEach((a, i) => (obj.entities[idx].pose[i] = a));
      return true;
    }
  }
}

export class ServerRegion {
  constructor(rx = 0, ry = 0, rz = 0) {
    this.id = `r${Math.floor(rx)}x${Math.floor(ry)}x${Math.floor(rz)}`;
    this.rx = rx | 0;
    this.ry = ry | 0;
    this.rz = rz | 0;
    this.saveTimer = null;
    this.eventCount = 0;
    this.saved = 0;
    this.loaded = 0;
    this.appended = 0;
    this.state = undefined;
    this.unsaved = [];
    this.flush = this.flush.bind(this);
    if (serverRegionRecord[this.id]) {
      console.log('Warning: ServerRegion already exists for id', this.id);
    }
    serverRegionRecord[this.id] = this;
  }

  static addConnectedPlayer(ctx) {
    const player = ctx.player;
    if (!player || !player.id) {
      throw new Error("Invalid player object");
    }
    connectedPlayers[player.id] = ctx;
  }

  static removeConnectedPlayer(ctx) {
    const player = ctx.player;
    if (!player || !player.id) {
      throw new Error("Invalid player object");
    }
    delete connectedPlayers[player.id];
  }

  /**
   * 
   * @param {number} rx  The region x coordinate (absolute position divided by 64)
   * @param {number} ry  The region y coordinate (absolute position divided by 64)
   * @param {number} rz  The region z coordinate (absolute position divided by 64)
   */
  static get(rx, ry, rz) {
    const id = `r${Math.floor(rx)}x${Math.floor(ry)}x${Math.floor(rz)}`;
    if (!serverRegionRecord[id]) {
      serverRegionRecord[id] = new ServerRegion(rx, ry, rz);
    }
    return serverRegionRecord[id];
  }

  async exists() {
    if (this.state && this.state.fileSize > 0) {
      return true;
    }
    try {
      this.state = await loadServerRegionState(this.id);
      if (this.state && this.state.fileSize > 0) {
        return true;
      }
    } catch (err) {
      console.error(`Failed to load region state for ${this.id}:`, err);
    }
    return false;
  }

  /**
   * Creates an instance of a server region from the given coordinates, string, or object.
   *
   * @param {string | number | ServerRegion | number[]} rx
   * @param {number} [ry]
   * @param {number} [rz]
   * @returns {ServerRegion}
   */
  static from(rx, ry, rz) {
    if (rx instanceof ServerRegion && !ry && !rz) {
      return rx;
    }
    if (typeof rx === "string" && ry === undefined && rz === undefined) {
      if (serverRegionRecord[rx]) {
        return serverRegionRecord[rx];
      }
      if (rx.startsWith("b") && rx.includes("/") && rx.includes("x")) {
        rx = rx.replace("b", "").replace("/", ",").replace("x", ",");
      }
      if (rx.includes(",")) {
        const a = rx.split(",");
        rx = parseFloat(a[0]);
        ry = parseFloat(a[1]);
        rz = parseFloat(a[2]);
      }
    }
    if (
      rx instanceof Array &&
      rx.length === 3 &&
      !ry &&
      !rz
    ) {
      rz = rx[2];
      ry = rx[1];
      rx = rx[0];
    }
    if (
      rx === undefined ||
      ry === undefined ||
      rz === undefined ||
      rx === null ||
      ry === null ||
      rz === null
    ) {
      throw new Error("Invalid arguments");
    }
    if (typeof rx === "string") {
      rx = parseInt(rx);
    }
    if (typeof ry === "string") {
      ry = parseInt(ry);
    }
    if (typeof rz === "string") {
      rz = parseInt(rz);
    }
    if (typeof rx !== "number" || isNaN(rx) || isNaN(ry) || isNaN(rz)) {
      throw new Error("Invalid arguments");
    }
    return ServerRegion.get(rx, ry, rz);
  }

  distance(other) {
    return Math.sqrt(
      Math.pow(this.rx - other.rx, 2) +
      Math.pow(this.ry - other.ry, 2) +
      Math.pow(this.rz - other.rz, 2)
    );
  }

  async add(event, immediate = false) {
    if (!this.loaded) {
      await this.load();
    }
    if (!event.time) {
      event.time = Date.now();
    }
    if (!applyServerRegionEvent(this.state, event)) {
      console.log('Event did not change region state:', event.pose);
      return event;
    }
    const others = Object.values(connectedPlayers).filter((ctx) => ctx?.send && ctx.player && event.player && ctx.player.id !== event.player && ctx.region);
    if (others.length) {
      console.log('Broadcasting',event.player,'event to', others.length, 'connected players:', event);
      for (const ctx of others) {
        const distance = ctx.region.distance(this);
        if (distance <= 3) {
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

  static async flushAll() {
    for (const region of Object.values(serverRegionRecord)) {
      if (!region.loaded && !region.unsaved.length && !region.eventCount) {
        continue;
      }
      await region.flush();
    }
  }

  /**
   * Write the changes to disk
   */
  async flush() {
    if (this.flushing) {
      console.log('Flush already in progress for region', this.id);
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
            "Saving full region state",
            [this.id],
            "with",
            this.unsaved.length + this.eventCount,
            "events"
          );
          this.state.rx = this.rx;
          this.state.ry = this.ry;
          this.state.rz = this.rz;
          this.state.fileSize = await writeServerRegionState(this.id, this.state);
          await clearServerRegionChanges(this.id);
          this.saved = Date.now();
          this.unsaved = [];
          this.eventCount = 0;
        } else if (this.unsaved.length) {
          console.log(
            "Appending region changes",
            [this.id],
            "with",
            this.unsaved.length,
            "events"
          );
          await appendServerRegionChanges(this.id, this.unsaved);
          this.appended = Date.now();
          this.eventCount += this.unsaved.length;
          this.unsaved = [];
        } else {
          console.log('No changes to flush for region', this.id);
        }
      } catch (err) {
        console.log('Failed to flush region', this.id, 'with', this.unsaved.length, 'unsaved events');
        throw err;
      } finally {
        this.flushing = false;
        this.flushPromise = null;
      }
    })();

    return this.flushPromise;
  }

  async load() {
    this.state = await loadServerRegionState(this.id, sampleState);
    const isEmpty = this.state === sampleState;
    if (isEmpty) {
      this.state.rx = this.rx;
      this.state.ry = this.ry;
      this.state.rz = this.rz;
      sampleState = JSON.parse(JSON.stringify(sampleState));
    }
    const changes = await loadServerRegionChanges(this.id);
    if (isEmpty && changes.length) {
      console.log(`Loaded region ${this.id} with ${changes.length} changes, but no state found.`);
    }
    for (const event of changes) {
      applyServerRegionEvent(this.state, event);
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
    const rx = Math.floor(x / 64);
    const ry = Math.floor(y / 64);
    const rz = Math.floor(z / 64);
    return ServerRegion.from(rx, ry, rz);
  }
}
