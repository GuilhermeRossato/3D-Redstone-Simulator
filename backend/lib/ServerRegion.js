

import fs from 'fs';
import { getStorageObjectFilePath } from "./primitives/StorageObjectStore.js";
import {
  appendServerRegionChanges,
  clearServerRegionChanges,
  loadServerRegionChanges,
  loadServerRegionState,
  writeServerRegionState,
} from "./ServerRegionStore.js";
import { sleep } from '../utils/sleep.js';

const saved_event_limit = 64;
const unsaved_event_limit = 128;
const unsaved_time_limit = 3000;

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
  if (!obj?.id) {
    throw new Error("Invalid unloaded server region on apply: Missing id");
  }
  if (!obj.entities) {
    obj.entities = {};
  }
  if (!obj.players) {
    obj.players = {};
  }
  if (typeof event.id !== 'string' || !event.id.startsWith('e') || event.id.length < 5) {
    throw new Error("Invalid entity id in event object: " + JSON.stringify(event));
  }
  const pose = typeof event.pose === 'object' && event.pose && event.pose instanceof Array && event.pose.length >= 3 ? event.pose : event.entity === 'object' && Array.isArray(event.entity.pose) && event.entity.pose.length >= 3 ? event.entity.pose : typeof event.pose === 'object' && Array.isArray(event.pose) && event.pose.length >= 3 ? event.pose : undefined;
  if (!event.player || typeof event.player !== 'string' || !event.player.startsWith('p') || event.player.length < 5) {
    throw new Error("Invalid player in event object");
  }
  const entity = obj.entities[event.id];
  if (entity&&event.type==="punch") {
    return true;
  }
  if (['despawn', 'leave'].includes(event.type)) {
    if (!event.id) {
      throw new Error("Invalid despawn event: Missing or invalid entity id");
    }
    if (!entity) {
      if (event.player && obj.players && obj.players[event.player]) {
        console.log("Incomplete", event.type, "event: Entity not found but player exists in region", obj.id);
        delete obj.players[event.player];
        return true;
      }
      console.log("Unnecessary", event.type, "event: Entity not found in region", obj.id);
      return false;
    }
    console.log("Applying", event.type, "event (removing", event.id, "entity) in region", obj.id);
    event.exited = obj.id;
    if (obj.players?.[entity?.player]) {
      delete obj.players[event.player];
    }
    if (event.player && obj.players && obj.players[event.player]) {
      delete obj.players[event.player];
    }
    delete obj.entities[event.id];
    return true;
  }
  if ((event.type === "move" || event.type === 'enter' || event.type === 'spawn') && (!pose || !Array.isArray(pose) || pose.length < 3)) {
    throw new Error(`Invalid ${event.type} event: Missing or invalid pose`);
  }
  if (event.type === 'spawn' || event.type === 'enter') {
    if (!pose || !Array.isArray(pose) || pose.length < 3) {
      throw new Error("Invalid spawn event: Missing or invalid entity / pose");
    }
    if (!event.id.startsWith('e')) {
      throw new Error("Invalid spawn event: Entity ID must start with 'e'");
    }
    if (!entity) {
      if (event.player) {
        if (!obj.players) {
          obj.players = {};
        }
        obj.players[event.player] = event.id;
      }
      console.log('Applying entity adding event of', event.id, 'in region', obj.id);
      event.entered = event.time || Date.now();
      const regionEntity = { ...event.entity, player: event.entity?.player || event?.player?.id || event.player, id: event.id, pose: [...pose] };
      delete regionEntity.type;
      regionEntity[event.type === 'spawn' ? 'spawned' : 'entered'] = event.time || Date.now();
      if (!regionEntity.pose || !regionEntity.id) {
        throw new Error("Invalid add event: Invalid entity");
      }
      obj.entities[event.id] = regionEntity;
      return true;
    }
  }
  if (event.type === 'spawn' || event.type === 'enter' || event.type === "move" || event.type === 'teleport') {
    const perfectMatch = entity && event.entity && pose && entity?.id && entity?.pose && JSON.stringify(entity?.pose) === JSON.stringify(pose);
    if (perfectMatch) {
      if (event.player && obj.players && !obj.players[event.player]) {
        console.log("Incomplete", event.type, "event: Entity found but player did not exist in region", obj.id);
        obj.players[event.player] = event.id;
        return true;
      }
      console.log("Unecessary", event.type, "event: Entity present at exact location in region", obj.id);
      return false;
    }
    if (event.player && obj.players && !obj.players[event.player]) {
      console.log("Applying", event.type, "event: Entity and player", event.player, "set in", obj.id);
      obj.players[event.player] = event.id;
    }
    if (!entity) {
      if (event.type === "move") {
        console.log('Ignoring move event of unitialized entity:', event.id, 'in region', obj.id);
        return false;
      }
      console.log("Applying", event.type, "event by adding entity", event.id, "in", obj.id);
      if (!event.entity || typeof event.entity !== 'object' || !pose || !Array.isArray(pose) || pose.length < 3) {
        throw new Error("Invalid adding event: Missing or invalid entity / pose");
      }
      const playerId = event.player;
      if (playerId) {
        if (!obj.players) {
          obj.players = {};
        }
        obj.players[event.player] = event.id;
      }
      console.log('Applying addition of', event.id, 'in region', obj.id);
      event.entered = obj.id;
      const regionEntity = { ...event.entity, player: event.entity?.player?.id || event?.player?.id || event.player, id: event.id };
      regionEntity[event.type === 'spawn' ? 'spawned' : 'entered'] = event.time || Date.now()
      delete regionEntity.type;
      if (!regionEntity.pose) {
        if (!pose) {
          throw new Error("Invalid spawn event: Missing or invalid entity pose");
        }
        regionEntity.pose = pose;
      }
      if (!regionEntity.id) {
        throw new Error("Invalid spawn event: Missing or invalid entity id");
      }
      obj.entities[event.id] = regionEntity;
      return true;
    }
    // console.log("Applying", event.type, "event by updating pose in", obj.id);
    if (entity?.id !== event.id) {
      console.log(`Warning: Entity ID mismatch in ${event.type} event: expected ${entity?.id}, got ${event.id}`);
    }
    for (let i = 0; i < 6; i++) {
      entity.pose[i] = i < pose.length ? pose[i] : 0;
    }
    return true;
  }
  throw new Error(`Invalid event type "${event.type}" for server region: ${JSON.stringify(event)}`);
}

export class ServerRegion {
  async getEntities() {
    if (!this.loaded) {
      await this.load();
    }
    if (!this.state || !this.state.entities) {
      return [];
    }
    return Object.values(this.state?.entities || {});
  }

  static getSurroundingRegions(pose, offset = 64, existenceCheck = true) {
    if (!pose || !Array.isArray(pose) || pose.length < 3) {
      throw new Error("Invalid pose: Must be an array with at least 3 elements");
    }
    if (typeof offset !== 'number' || isNaN(offset) || offset <= 0) {
      throw new Error("Invalid offset: Must be a positive number");
    }
    const regionIds = new Set([ServerRegion.getIdFromAbsolute(pose[0], pose[1], pose[2])]);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          regionIds.add(ServerRegion.getIdFromAbsolute(pose[0] + dx * offset, pose[1] + dy * offset, pose[2] + dz * offset));
        }
      }
    }
    const result = Array.from(regionIds).map((id) => ServerRegion.from(id));
    return existenceCheck ? result.filter((r) => r.existsSync()) : result;
  }

  static getIdFromRegionCoords(rx, ry, rz) {
    return `r${rx}x${ry}x${rz}`;
  }

  static getIdFromAbsolute(x, y = undefined, z = undefined) {
    if (x && typeof x === 'object' && x.pose instanceof Array && x.pose.length >= 3 && y === undefined && z === undefined) {
      z = x.pose[2];
      y = x.pose[1];
      x = x.pose[0];
    } else if (x instanceof Array && x.length >= 3 && y === undefined && z === undefined) {
      z = x[2];
      y = x[1];
      x = x[0];
    }
    const rx = Math.floor(x / 64);
    const ry = Math.floor(y / 64);
    const rz = Math.floor(z / 64);
    return ServerRegion.getIdFromRegionCoords(rx, ry, rz);
  }

  constructor(rx = 0, ry = 0, rz = 0) {
    this.id = ServerRegion.getIdFromRegionCoords(rx, ry, rz);
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
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
      const entries = Object.entries(connectedPlayers);
      const i = entries.findIndex(v => v[1] === ctx);
      if (i !== -1) {
        console.log('Removing player from connectedPlayers without player.id:', entries[i][0]);
        delete connectedPlayers[entries[i][0]];
        return true;
      }
      console.log('Not removing player from connectedPlayers:', ctx);
      return false;
    }
    if (player?.id && !connectedPlayers[player.id]) {
      console.log('Player not found in connectedPlayers:', player.id);
      return false;
    }
    delete connectedPlayers[player.id];
    return true;
  }

  /**
   * 
   * @param {number} rx  The region x coordinate (divided by 64)
   * @param {number} ry  The region y coordinate (divided by 64)
   * @param {number} rz  The region z coordinate (divided by 64)
   */
  static get(rx, ry, rz) {
    const id = ServerRegion.getIdFromRegionCoords(rx, ry, rz);
    if (!serverRegionRecord[id]) {
      serverRegionRecord[id] = new ServerRegion(rx, ry, rz);
    }
    return serverRegionRecord[id];
  }

  async getPlayerIds() {
    if (!this.id) {
      throw new Error("Region ID is not set. Cannot get players.");
    }
    if (!this.state || !this.loaded) {
      await this.load();
    }
    if (this.state && this.state.players) {
      return Object.keys(this.state.players);
    }
    return [];
  }

  static getPlayerContext(playerId, strict = false) {
    if (!playerId || !connectedPlayers[playerId]) {
      if (!strict) {
        return null;
      }
      throw new Error(`Player with ID ${playerId} is not connected.`);
    }
    return connectedPlayers[playerId];
  }

  existsSync() {
    if (!this.id) {
      throw new Error("Region ID is not set. Cannot check existence.");
    }
    if (this.state && this.state.fileSize > 0) {
      return true;
    }
    return fs.existsSync(getStorageObjectFilePath("region", this.id, false));
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
      if (rx.startsWith("r") && rx.includes("x")) {
        rx = rx.replace("r", "").replace("/", ",").replace("x", ",").replace("x", ",");
      }
      if (rx.includes(",") && !rx.includes(".")) {
        const a = rx.split(",");
        rx = parseInt(a[0]);
        ry = parseInt(a[1]);
        rz = parseInt(a[2]);
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
      throw new Error(`Invalid arguments: ${JSON.stringify({ rx, ry, rz })}`);
    }
    return ServerRegion.get(rx, ry, rz);
  }

  distance(other) {
    if (other === this) return 0;
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
      if (event.type !== "move") {
        console.log('Event did not change region state:', event.pose);
      }
      return event;
    }
    if (!event.player) {
      throw new Error('Currently only events with a player are supported');
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
        if (Date.now() - this.started_flush < 1000) {
          const end_time = this.finished_flush;
          await sleep(500);
          if (this.finished_flush !== end_time) {
            console.log('Another flush finished while waiting for region', this.id);
            return;
          }
        }
        this.started_flush = Date.now();
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
          const size = this.unsaved.length;
          this.state.fileSize = await writeServerRegionState(this.id, this.state);
          await clearServerRegionChanges(this.id);
          this.finished_flush = this.saved = Date.now();
          this.unsaved.splice(0, size);
          this.eventCount = 0;
        } else if (this.unsaved.length) {
          if (this.unsaved.length === 1) {
            console.log("Appending region change to", [this.id], "with event:", this.unsaved[0]);
          } else {
            console.log("Appending region change to", [this.id], "with", this.unsaved.length, "events with types:", this.unsaved.slice(0,8).map(e=>e.type));
          }
          const size = this.unsaved.length;
          await appendServerRegionChanges(this.id, this.unsaved);
          this.finished_flush = this.appended = Date.now();
          this.eventCount += size;
          this.unsaved.splice(0, size);
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
    }).call(this);

    return this.flushPromise;
  }

  async load(forceRefresh = false) {
    if (this.loaded && this.state && !forceRefresh) {
      console.log('Region', this.id, 'already loaded, skipping load');
      return this;
    }
    this.state = await loadServerRegionState(this.id, JSON.parse(JSON.stringify(sampleState)));
    this.state.id = this.id;
    this.state.rx = this.rx;
    this.state.ry = this.ry;
    this.state.rz = this.rz;
    const unfiltered = await loadServerRegionChanges(this.id);
    if (unfiltered.length) {
      console.log(`Loaded region ${this.id} with ${unfiltered.length} changes.`);
    }
    const changes = unfiltered.filter((event, index, array) => {
      if (event.type === 'spawn' && !event.id) {
        return false;
      }
      if (typeof event.id !== 'string' || !event.id.startsWith('e')) {
        return false;
      }
      return true;
    });
    for (const event of changes) {
      try {
        applyServerRegionEvent(this.state, event);
      } catch (err) {
        console.log(`Skipping failing event apply of type "${event.type}" for entity ${event.entity?.id || event.entity}:`, err.message);
      }
    }
    const entityKeys = Object.keys(this.state?.entities || {});
    console.log('Loaded region', this.id, 'with', changes.length, 'changes and', entityKeys.length, 'entities');
    this.eventCount = changes.length;
    this.loaded = Date.now();
    if (entityKeys.length) {
      const rx = this.rx;
      const ry = this.ry;
      const rz = this.rz;
      for (const id of entityKeys) {
        const e = this.state.entities[id];
        if (
          typeof e === 'object' &&
          e.id &&
          e.player &&
          !connectedPlayers[e.player]
        ) {
          console.log('Skipping entity', e.id, 'from region', this.id, 'because player', e.player, 'is not connected');
          delete this.state.entities[id];
          continue;
        }
        if (
          typeof e !== 'object' ||
          typeof e.pose !== 'object' ||
          !Array.isArray(e.pose) ||
          e.pose.length < 3
        ) {
          console.log('Invalid entity pose in region', e.id, ':', e?.pose);
          delete this.state.entities[id];
          continue;
        }
        if (
          typeof e === 'object' &&
          (rx !== Math.floor(e.pose[0] / 64) ||
            ry !== Math.floor(e.pose[1] / 64) ||
            rz !== Math.floor(e.pose[2] / 64))
        ) {
          console.log('Invalid entity pose outside region', e.id, ':', e?.pose);
          delete this.state.entities[id];
          continue;
        }
      }
    } return this;
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
