import fs from 'fs';
import { getStorageObjectFilePath } from "./primitives/StorageObjectStore.js";
import {
  appendServerRegionChanges,
  clearServerRegionChanges,
  loadServerRegionChanges,
  loadServerRegionState,
  writeServerRegionState,
} from "./ServerRegionStore.js";
import { createServerStore } from './ServerStore.js';
import { ServerChunk } from './ServerChunk.js';

const unsaved_event_limit = 128;
const unsaved_time_limit = 3000;

export const connectedPlayers = {};

export const serverRegionRecord = {};

let sampleState = {
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
    obj.entities = {};
  }
  if (!obj.players) {
    obj.players = {};
  }
  let entityId = '';
  if (typeof event.id === 'string' && event.id.startsWith('e') && event.id.length >= 5) {
    entityId = event.id;
  } else if (typeof event.entity === 'string' && event.entity.length >= 5) {
    entityId = event.entity.startsWith('e') ? event.entity : `e${event.entity}`;
  } else if (typeof event.entityId === 'string' && event.entityId.startsWith('e') && event.entityId.length >= 5) {
    entityId = event.entityId;
  } else if (typeof event.entity === 'object' && event.entity && typeof event.entity.id === 'string' && event.entity.id.length >= 5) {
    entityId = event.entity.id.startsWith('e') ? event.entity.id : `e${event.entity.id}`;
  }
  let playerId = '';
  if (typeof event.id === 'string' && event.id.startsWith('p') && event.id.length >= 5) {
    playerId = event.id;
  } else if (typeof event.player === 'string' && event.player.length >= 5) {
    playerId = event.player.startsWith('p') ? event.player : `p${event.player}`;
  } else if (typeof event.playerId === 'string' && event.playerId.startsWith('p')) {
    playerId = event.playerId;
  } else if (typeof event.player === 'object' && event.player && typeof event.player.id === 'string' && event.player.id.length >= 5) {
    playerId = event.player.id.startsWith('p') ? event.player.id : `p${event.player.id}`;
  }
  if (event.type === 'leave' || event.type === 'despawn' || event.type === 'exit') {
    if (obj.entities[entityId]) {
      if (typeof playerId === 'string' && obj.players[playerId]) {
        console.log("Applying", event.type, "event: Entity and player", playerId, "removed in", obj.id);
        delete obj.entities[entityId];
        delete obj.players[playerId];
        return true;
      }
      console.log("Applying", event.type, "event: Entity removed in", obj.id);
      delete obj.entities[entityId];
      console.warn("Warning: Despawn event without player:", event);
      return true;
    } else {
      if (typeof playerId === 'string' && obj.players[playerId]) {
        console.log("Applying", event.type, "event: Player", playerId, "removed in", obj.id);
        delete obj.players[playerId];
        return true;
      }
      console.log("Unnecessary", event.type, "event: Entity", entityId, "not found in region", obj.id);
      return false;
    }
  }
  if (typeof entityId !== 'string' || !entityId.startsWith('e') || entityId.length < 5) {
    throw new Error(`Invalid entity id in event object: ${JSON.stringify(event)}`);
  }
  const pose = typeof event.pose === 'object' && event.pose && event.pose instanceof Array && event.pose.length >= 3 ? event.pose : event.entity === 'object' && Array.isArray(event.entity.pose) && event.entity.pose.length >= 3 ? event.entity.pose : typeof event.pose === 'object' && Array.isArray(event.pose) && event.pose.length >= 3 ? event.pose : undefined;
  if (!event.player || typeof event.player !== 'string' || !event.player.startsWith('p') || event.player.length < 5) {
    throw new Error("Invalid player in event object");
  }
  const entity = obj.entities[entityId];
  if (entity && event.type === "punch") {
    return true;
  }
  if (['despawn', 'leave'].includes(event.type)) {
    if (!entityId) {
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
    console.log("Applying", event.type, "event (removing", entityId, "entity) in region", obj.id);
    event.exited = obj.id;
    if (obj.players?.[entity?.player]) {
      delete obj.players[event.player];
    }
    if (event.player && obj.players && obj.players[event.player]) {
      delete obj.players[event.player];
    }
    delete obj.entities[entityId];
    return true;
  }
  if ((event.type === "move" || event.type === 'enter' || event.type === 'spawn') && (!pose || !Array.isArray(pose) || pose.length < 3)) {
    throw new Error(`Invalid ${event.type} event: Missing or invalid pose`);
  }
  if (event.type === 'spawn' || event.type === 'enter') {
    if (!pose || !Array.isArray(pose) || pose.length < 3) {
      throw new Error("Invalid spawn event: Missing or invalid entity / pose");
    }
    if (!entityId.startsWith('e')) {
      throw new Error("Invalid spawn event: Entity ID must start with 'e'");
    }
    if (!entity) {
      if (event.player) {
        if (!obj.players) {
          obj.players = {};
        }
        obj.players[event.player] = entityId;
      }
      console.log('Applying entity add event of', entityId, 'in region', obj.id, "with position", pose.slice(0, 3).map(a => parseFloat(a.toFixed(2))));
      event.entered = event.time || Date.now();
      const regionEntity = { ...event.entity, player: event.entity?.player || event?.player?.id || event.player, id: entityId, pose: [...pose] };
      delete regionEntity.type;
      regionEntity[event.type === 'spawn' ? 'spawned' : 'entered'] = event.time || Date.now();
      if (!regionEntity.pose || !regionEntity.id) {
        throw new Error("Invalid add event: Invalid entity");
      }
      obj.entities[entityId] = regionEntity;
      return true;
    }
  }
  if (event.type === 'spawn' || event.type === 'enter' || event.type === "move" || event.type === 'teleport') {
    const perfectMatch = entity && event.entity && pose && entity?.id && entity?.pose && JSON.stringify(entity?.pose) === JSON.stringify(pose);
    if (perfectMatch) {
      if (event.player && obj.players && !obj.players[event.player]) {
        console.log("Incomplete", event.type, "event: Entity found but player did not exist in region", obj.id);
        obj.players[event.player] = entityId;
        return true;
      }
      console.log("Unecessary", event.type, "event: Entity present at exact location in region", obj.id);
      return false;
    }
    if (event.player && obj.players && !obj.players[event.player]) {
      console.log("Applying", event.type, "event: Entity and player", event.player, "set in", obj.id);
      obj.players[event.player] = entityId;
    }
    if (!entity) {
      if (event.type === "move") {
        console.log('Ignoring move event of unitialized entity:', entityId, 'in region', obj.id);
        return false;
      }
      console.log("Applying", event.type, "event by adding entity", entityId, "in", obj.id);
      if (!event.entity || typeof event.entity !== 'object' || !pose || !Array.isArray(pose) || pose.length < 3) {
        throw new Error("Invalid adding event: Missing or invalid entity / pose");
      }
      const playerId = event.player;
      if (playerId) {
        if (!obj.players) {
          obj.players = {};
        }
        obj.players[event.player] = entityId;
      }
      console.log('Applying addition of', entityId, 'in region', obj.id);
      event.entered = obj.id;
      const regionEntity = { ...event.entity, player: event.entity?.player?.id || event?.player?.id || event.player, id: entityId };
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
      obj.entities[entityId] = regionEntity;
      return true;
    }
    // console.log("Applying", event.type, "event by updating pose in", obj.id);
    if (entity?.id !== entityId) {
      console.log(`Warning: Entity ID mismatch in ${event.type} event: expected ${entity?.id}, got ${entityId}`);
    }
    for (let i = 0; i < 6; i++) {
      entity.pose[i] = i < pose.length ? pose[i] : 0;
    }
    return true;
  }
  if (event.type === 'punch') {
    return true;
  }
  throw new Error(`Invalid event type "${event.type}" for server region: ${JSON.stringify(event)}`);
}

const regionStore = createServerStore({
  typeName: 'region',
  unsaved_event_limit,
  unsaved_time_limit,
  sampleState,
  loadState: async (id, sample) => await loadServerRegionState(id, sample),
  loadChanges: async (id) => await loadServerRegionChanges(id),
  writeState: async (id, state) => await writeServerRegionState(id, state),
  appendChanges: async (id, changes) => await appendServerRegionChanges(id, changes),
  clearChanges: async (id) => await clearServerRegionChanges(id),
  applyEvent: applyServerRegionEvent,
  serializeState: (stateClone) => {
    // remove coordinates before write
    delete stateClone.rx;
    delete stateClone.ry;
    delete stateClone.rz;
  },
});

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

  distance(other) {
    if (other === this) return 0;
    const pos = (
      other && other instanceof ServerRegion ? [other.rx, other.ry, other.rz] :
        other && other instanceof ServerChunk ? [other.cx * 16 / 64, other.cy * 16 / 64, other.cz * 16 / 64] :
          other && typeof other === 'object' && other.pose instanceof Array && other.pose.length >= 3 ? other.pose : other && Array.isArray(other) && other.length >= 3 ? other.map(a => a / 64) :
            null
    )
    if (!pos) {
      throw new Error("Invalid argument: Must be a ServerRegion, ServerChunk, or an object/array with a 'pose' array of at least 3 numbers");
    }
    const [rx, ry, rz] = pos.map(a => Math.floor(a));
    return Math.sqrt(
      Math.pow(this.rx - rx, 2) +
      Math.pow(this.ry - ry, 2) +
      Math.pow(this.rz - rz, 2)
    );
  }

  async add(event, immediate = false) {
    if (!event.time) {
      event.time = Date.now();
    }
    if (!this.loaded) {
      await this.load();
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
    const entityId = event.id && event.id.startsWith('e') ? event.id : event.entity && typeof event.entity === 'string' && event.entity.startsWith('e') ? event.entity : event.entity && typeof event.entity === 'object' && event.entity.id && event.entity.id.startsWith('e') ? event.entity.id : '';
    const others = Object.values(connectedPlayers).filter((ctx) => ctx?.entity?.id !== entityId && ctx.send);
    const promise = regionStore.add(this, event, immediate);
    if (others.length) {
      console.log('Broadcasting', event.player, 'event to', others.length, 'connected players:', event);
      for (const ctx of others) {
        const distance = ctx.region.distance(this);
        //console.log(`Evaluating`, event.type, `broadcast to player ${ctx.player.id} from "${this.id}" in region "${ctx.region.id}" with distance ${distance}`);
        if (distance <= 2) {
          ctx.send(event);
        }
      }
    } else {
      // console.log('No other connected players to broadcast event:', event);
    }
    return await promise;
  }

  getTimeSinceLoad() {
    return Date.now() - this.loaded;
  }

  static async flushAll() {
    for (const region of Object.values(serverRegionRecord)) {
      if (!region.loaded && !region.unsaved.length && !region.eventCount) {
        continue;
      }
      await region.flush();
    }
  }

  async flush() {
    return await regionStore.flush(this);
  }

  async load(forceRefresh = false) {
    console.log('Loading region', this.id);
    return await regionStore.load(this, forceRefresh);
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

}
