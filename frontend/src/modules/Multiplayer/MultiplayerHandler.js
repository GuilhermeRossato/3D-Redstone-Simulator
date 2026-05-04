import { setPlayerPosition } from "../InputHandler.js";
import { updateLastRegionId, updateSelfState } from "./ExternalSelfStateHandler.js";
import * as EntityHandler from "../EntityHandler.js";
import * as WorldHandler from "../../world/WorldHandler.js";
import { initializeSocket, sendEvent } from "./SocketHandler.js";
import { createSnackbarAlert } from "../../utils/createSnackbarAlert.js";
import { g } from "../../utils/g.js";
import { sleep } from "../../utils/sleep.js";
import { scene } from "../GraphicsHandler.js";
import { setDebugInfo } from "../../foreground/DebugInfo.js";

setDebugInfo("MultiplayerHandler");

let clist = [];
g("clist", clist);

export const flags = {
  connected: false,
  active: false,
};

export class MultiplayerHandler {

  static init() {
    if (!(this instanceof MultiplayerHandler)) {
      console.warn("MultiplayerHandler.init() should be called on the class, not on an instance");
    }
    console.log("Initializing MultiplayerHandler...");
    this.playerEntityRecord = {};
    this.playerEntityList = [];
    this.socketType = getPreferredSocketType();
    this.cookieId = getCookieId();
    this.playerId = getPlayerId();
    this.sessionId = getSessionId();
    console.log("MultiplayerHandler initialized with playerId", this.playerId, "cookieId", this.cookieId, "sessionId", this.sessionId);
  }

  static reset() {
    if (!(this instanceof MultiplayerHandler)) {
      console.warn("MultiplayerHandler.reset() should be called on the class, not on an instance");
    }
    this.socketType = getPreferredSocketType();
    this.cookieId = getCookieId();
    this.playerId = getPlayerId();
    this.sessionId = getSessionId();
  }

}

const sd = () => setDebugInfo(
  "MultiplayerHandler",
  `${player.id} ${player.entity} (self)`,
  `${MultiplayerHandler.playerEntityList?.length} others`,
  MultiplayerHandler.playerEntityList?.join?.('\n')
);


/** @typedef {{
 *   id: number;
 *   name: string;
 *   x: number;
 *   y: number;
 *   z: number;
 *   type: string;
 *   props: Record<string, string>
 *   health: number;
 *   maxHealth: number;
 * }} EntityObject */

/** @typedef {EntityObject & {
 *   type: 'player';
 *   playerId: string;
 *   entityId: string;
 *   props: {
 *    yaw: number;
 *    pitch: number;
 *  }
 * }} PlayerObject */

/** @type {undefined | PlayerObject} */
let player;

/** @type {any} */
let entity;

export function getPlayerEntityId() {
  if (!player || !player.entityId) {
    console.warn("Player entity is not initialized");
    return null;
  }
  return player.entityId;
}

export async function load() {
  try {
    console.log("Initializing socket...");
    await initializeSocket();
    player = await performLogin();
    flags.active = true;
  } catch (err) {
    console.log('Multiplayer failed to start:', err.message);
    flags.active = false;
    err.message = `Multiplayer failed to start: ${err.message}`;
    throw err;
  }
  return flags.active;
}

g("processServerChunkResponse", processServerChunkResponse);

async function processServerChunkResponse(responses, c = []) {
  console.log('Processing chunk response', responses);
  const chunks = (responses instanceof Array) ? responses : [responses];
  if (!chunks || (Array.isArray(chunks) && chunks.length === 0)) {
    return;
  }
  for (const chunk of chunks) {
    if (!chunk.blocks || Object.keys(chunk.blocks).length === 0) {
      continue;
    }
    const cid = chunk.id || chunk.chunkId || chunk.cid;
    if (cid && typeof cid === "string" && cid.startsWith("c") && (typeof chunk.cx !== "number" || typeof chunk.cy !== "number" || typeof chunk.cz !== "number")) {
      const c = (cid.substring(1).match(/-?\d+/g) || []).map(i => parseInt(i));
      if (c.length === 3 && c.every(i => !isNaN(i))) {
        chunk.cx = c[0];
        chunk.cy = c[1];
        chunk.cz = c[2];
      }
    }
    for (let y in chunk.blocks) {
      if (y && (typeof y === 'string'||typeof y === 'integer')) {
        y = chunk.blocks[y];
      }
      if (y && typeof y === 'object' && y instanceof Array && y.length === 4 && y.every(i => !isNaN(i))) {
        c.push([chunk.cx * 16 + Number(y[0]), chunk.cy * 16 + Number(y[1]), chunk.cz * 16 + Number(y[2]), y[3]]);
        continue;
      }
      for (const x in chunk.blocks[y]) {
        for (const z in chunk.blocks[y][x]) {
          const id = chunk.blocks[y][x][z];
          if (id === 0 || id === null || id === undefined || id === false) {
            continue;
          }
          c.push([chunk.cx * 16 + Number(x), chunk.cy * 16 + Number(y), chunk.cz * 16 + Number(z), id]);
        }
      }
    }
    console.log('Initializing chunk at', chunk.cx, chunk.cy, chunk.cz, 'with', c.length, 'blocks');
    const instance = WorldHandler.getChunk(chunk.cx, chunk.cy, chunk.cz, true);

    for (const [x,y,z,bid] of c) {
      if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(bid)) {
        console.warn('Skipping invalid block data in chunk response:', {x,y,z,bid});
        continue;
      }
      instance.set(x - chunk.cx * 16, y - chunk.cy * 16, z - chunk.cz * 16, bid);
    }
    if (!instance.scene) {
      console.log('Creating scene for chunk', instance);
      instance.assignTo(scene);
      instance.requestMeshUpdate();
    }
  }
  return c;
}

async function processServerRegionResponse(region) {
  //console.log('Processing region', region.id, 'with', (region.entities instanceof Array) ? region.entities.length : 0, 'entities');
  const entities = region.entities;
  if (!entities || (typeof entities === 'object' && Object.keys(entities).length === 0)) {
    return;
  }
  if (typeof entities !== 'object' || Array.isArray(entities)) {
    throw new Error("Received entities in invalid format, expected an array of entities");
  }
  let list = entities instanceof Array ? entities : Object.values(entities);
  for (const entity of list) {
    //console.log("Adding entity", entity.id, "to scene");

    EntityHandler.addEntityToScene(entity);
  }
}

/**
 * @param {PlayerObject} player
 */
function addOtherPlayer(player) {
  if (!player || !player.id) {
    console.warn("Skipping addition of player because of missing id");
    console.log(player);
    return;
  }
  const mesh = EntityHandler.addEntityToScene(player);

  MultiplayerHandler.playerEntityRecord[player.id] = {
    mesh,
    movement: null,
  };
}

/**
 * @param {{x: number, y: number, z: number, id: number}[]} blockList
 */
function initWorld(blockList) {
  for (const { x, y, z, id } of blockList) {
    if (id === 0) {
      continue;
    }
    WorldHandler.set(x, y, z, id);
  }
}

export function getPlayerId() {
  const pid = window.localStorage.getItem("last-player-id") || "";
  if (pid && !pid.startsWith('p')) {
    return `p${pid}`;
  }
  return pid;
}

export function getSessionId() {
  const sid = window.sessionStorage.getItem("last-session-id") || "";
  if (sid && !sid.startsWith('s')) {
    return `s${sid}`;
  }
  return sid;
}

export function getCookieId() {
  let cookieId = "";
  const cookieString = document.cookie;
  if (typeof cookieString === "string") {
    const cookie = (cookieString.split(";").find((c) => c.trim().startsWith("id=")) || "").trim();
    if (cookie) {
      cookieId = cookie.substring(cookie.indexOf("=") + 1).trim();
    }
  }
  if (!cookieId) {
    cookieId = sessionStorage.getItem("last-cookie-id") || "";
  }
  if (!cookieId) {
    cookieId = localStorage.getItem("last-cookie-id") || "";
  }
  return cookieId;
}

export function setPlayerId(id) {
  if (id) {
    const pid = id.startsWith('p') ? id : `p${id}`;
    window.localStorage.setItem("last-player-id", pid);
    MultiplayerHandler.playerId = pid;
  }
  const pid = window.localStorage.getItem("last-player-id") || "";
  if (pid && !pid.startsWith('p')) {
    return `p${pid}`;
  }
  return pid;
}

export function setCookieId(cookieId) {
  if (cookieId) {
    document.cookie = `id=${cookieId}; expires=${new Date(new Date().getTime() + 31_536_000_000).toUTCString()}`;
    sessionStorage.setItem("last-cookie-id", cookieId);
    localStorage.setItem("last-cookie-id", cookieId);
    MultiplayerHandler.cookieId = cookieId;
  }
  return cookieId;
}

export function setSessionId(sessionId) {
  if (sessionId) {
    sessionStorage.setItem("last-session-id", sessionId);
    MultiplayerHandler.sessionId = sessionId;
  }
  return sessionId;
}

function loadLocalBlockTypeTimes() {
  let blocksTimes = {};
  try {
    const blockTimesStr = localStorage.getItem('block-times');
    if (blockTimesStr) {
      blocksTimes = JSON.parse(blockTimesStr);
    }
    if (!blocksTimes || typeof blocksTimes !== 'object' || Array.isArray(blocksTimes) || Object.keys(blocksTimes).length === 0) {
      blocksTimes = {};
    }
  } catch (err) {
    console.error(err);
  }
  return blocksTimes || {};
}

function getStartPose() {
  let startPose = (sessionStorage.getItem('last-player-pose') || '0').split(',').map(i => parseFloat(i))
  if (startPose.length < 3 || startPose.slice(0, 6).some(num => isNaN(num))) {
    startPose = (localStorage.getItem('last-player-pose') || '0').split(',').map(i => parseFloat(i));
  }
  if (startPose.length < 3 || startPose.slice(0, 6).some(num => isNaN(num))) {
    startPose = undefined;
  }
  if (!startPose || !(startPose instanceof Array) || !startPose.length || startPose.length < 3) {
    startPose = [0, 0, 0];
  }
  if (startPose.length < 4) {
    startPose.push(0);
  }
  if (startPose.length < 5) {
    startPose.push(0);
  }
  if (startPose.length < 6) {
    startPose.push(0);
  }
  if (startPose.length > 6) {
    startPose = startPose.slice(0, 6);
  }
  return startPose;
}

function processServerElement(id, data) {
  console.log("Processing server element", id, data);
  if (data.chunkId && data.blocks) {
    return processServerChunkResponse(data);
  }
  /*{
    "chunkId": "c0/0x0",
      "blocks": [
        [
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          2,
          1
        ],
        [
          0,
          0,
          3,
          1
        ],
        [
          0,
          0,
          4,
          1
        ]
      ],
        "entities": []
  }
        */
}
async function performLogin() {
  //const snack = await createSnackbarAlert("Performing login...", "info");
  const pose = getStartPose();
  MultiplayerHandler.reset();
  const pkt = await sendEvent({
    type: "setup",
    playerId: MultiplayerHandler.playerId,
    cookieId: MultiplayerHandler.cookieId,
    sessionId: MultiplayerHandler.sessionId,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    screenTop: window.screenY,
    screenLeft: window.screenX,
    pose,
  }, true);

  if (!pkt) {
    createSnackbarAlert("No response received from server on login", "error");
    throw new Error("No response received from server on login");
  }

  console.log("Setup response", pkt);

  if (pkt?.code === 'already-logged-in') {
    //snack("You are already logged in...");
    await sleep(2000);
  }

  if (!pkt || pkt.status !== "success") {
    //snack();
    createSnackbarAlert("The server did not return success", "error");
    console.log("Invalid server object:", pkt);
    throw new Error("Server did not return success on connection setup packet");
  }

  flags.connected = true;

  // Update player id
  if (typeof pkt.playerId === "string" && pkt.playerId !== MultiplayerHandler.playerId) {
    console.warn("Server returned different playerId, updating local storage");
    localStorage.setItem("last-player-id", pkt.playerId);
    MultiplayerHandler.playerId = pkt.playerId;
    setPlayerId(MultiplayerHandler.playerId);
  }
  // Update cookie id
  if (typeof pkt.cookieId === "string" && pkt.cookieId !== MultiplayerHandler.cookieId) {
    console.warn("Server returned different cookieId, updating cookie storage");
    setCookieId(pkt.cookieId);
  }
  // Update session id
  if (typeof pkt.sessionId === "string" && pkt.sessionId !== MultiplayerHandler.sessionId) {
    console.warn("Server returned different sessionId, updating session storage");
    setSessionId(pkt.sessionId);
  }

  const blockTypeTimes = loadLocalBlockTypeTimes();

  const ctx = await sendEvent({
    type: "context",
    pose,
    blockTypeTimes,
  }, true);

  console.log('Context response', ctx);

  if (!ctx || !ctx.player || !ctx.chunks || !ctx.regions) {
    //snack();
    createSnackbarAlert("Context request failed", "error");
    throw new Error("Received invalid context packet");
  }
  if (ctx.player?.pose instanceof Array && ctx.player.pose.length >= 3 && ctx.player.pose.slice(0, 6).every(num => !isNaN(num))) {
    setPlayerPosition(ctx.player.pose);
    localStorage.setItem("last-player-pose", ctx.player.pose.join(","));
    sessionStorage.setItem("last-player-pose", ctx.player.pose.join(","));
  }

  if (ctx.blocks) {
    WorldHandler.addBlockDefinitions(ctx.blocks);
  }

  const pending = [];

  for (const chunk of ctx.chunks) {
    pending.push(chunk);
  }

  for (const region of ctx.regions) {
    pending.push(region);
  }

  console.log("Pending chunks or regions to load:", pending.length);

  const groupSize = Math.ceil(pending.length / 9);
  const groups = pending.length < 9 ? pending.map(i => [i]) : Array.from({
    length: 9
  }, (_, index) => pending.slice(index * groupSize, index + 1 === 9 ? pending.length : (index + 1) * groupSize));
  // Perform server time syncronization
  const syncPairs = [];
  let maxOffset = -Infinity;
  let minOffset = Infinity;
  for (let i = 0; i < 9; i++) {
    const client = Date.now();
    const response = await sendEvent({
      index: i,
      type: "sync",
      client,
      subjects: groups[i],
    }, true);
    i <= 1 && console.log("Sync response:", response);
    const server = response?.server;
    if (!server || typeof server !== "number" || isNaN(server) || server <= 1000 || Math.abs(server - client) > 180_000) {
      console.log("Invalid server time received for synchronization:", response);
      throw new Error("Invalid or missing time values on sync: Server did not sent time or the client date does not match the server date");
    }
    const delta = client - server;
    syncPairs.push(delta);
    maxOffset = Math.max(maxOffset, delta);
    minOffset = Math.min(minOffset, delta);
    if (response.responses) {
      for (const id in response.responses) {
        console.log("Processing sync load:", id);
        processServerElement(id, response.responses[id]);
      }
    }
  }
  let array;
  if (syncPairs.length < 3) {
    array = syncPairs;
  } else {
    array = syncPairs.filter((pair) => Math.abs(minOffset - pair) >= 3 && Math.abs(maxOffset - pair) >= 3);
    if (array.length < 3) {
      array = syncPairs.filter((pair) => Math.abs(minOffset - pair) >= 1 && Math.abs(maxOffset - pair) >= 1);
    }
    if (array.length < 3) {
      array = syncPairs.filter((pair) => Math.abs(minOffset - pair) >= 0 && Math.abs(maxOffset - pair) >= 0);
    }
  }
  if (array.length < 3) {
    array = syncPairs;
  }
  while (array.length > 3) {
    array.pop();
    if (array.length > 3) {
      array.shift();
    }
  }
  if (array.length === 0 || array.some((d) => isNaN(d))) {
    throw new Error("Failed to retrieve valid time difference list on server syncronization");
  }

  const offset = Math.floor(array.reduce((p, c) => p + c, 0) / array.length);
  console.log('Clock offset:', offset, 'ms');
  // console.log(diffs.map((a) => new Date(a).toISOString().substring(14)), offset);
  const spawn = await sendEvent({
    type: "spawn",
    offset,
    entityId: ctx.entity?.id || "",
    pose,
  }, true);

  console.log('Spawned result entity:', spawn.entity);

  if (spawn && spawn.type === "error") {
    console.error("Spawn Error:", spawn.message, "\n", spawn.stack);
    throw new Error(`Server returned error on spawn: ${spawn.message}`);
  }

  if (typeof spawn?.entity?.pose !== "object") {
    console.log("Invalid server object (Missing player pose)", spawn);
    throw new Error("First context request did not return current player position data");
  }

  if (typeof spawn?.regionId === "string" && !spawn?.player?.regionId) {
    spawn.player.regionId = spawn.regionId;
  } else if (typeof spawn?.regionId !== "string" && !spawn?.player?.regionId) {
    console.warn("Server did not return regionId for player, and it was not included in the player object, defaulting to '0,0,0'");
    spawn.player.regionId = "r0/0,0";
  }

  g("player", (player = spawn.player));
  g("entity", (entity = spawn.entity));
  if (spawn.player.regionId) {
    updateLastRegionId(spawn.player.regionId);
  }
  return player;
}

export async function sendClientAction(action) {
  if (!flags.active) {
    return;
  }
  if (action.type === "move" && player) {
    action.id = player.entity;
  }
  if (["punch", "start-breaking", "stop-breaking", "finish-breaking", "place", "set", "remove",].includes(action.type)) {
    if (action.pos instanceof Array) {
      action.pos = action.pos.map((a, i) => i < 3 ? Math.floor(a) : a);
    } else if (typeof action.x === "number") {
      action.x = Math.floor(action.x);
      action.y = Math.floor(action.y);
      action.z = Math.floor(action.z);
    }
  }
  if (action.type === "set") {
    console.log(action);
  }
  await sendEvent(action);
}

export function update(frame) {
  if (flags.active && player) {
    updateSelfState(frame);
  }
}

export async function processServerPacket(packet) {
  // console.log("Received packet", packet);
  if (packet.type === "spawn") {
    console.log("Spawn packet received", packet);
    EntityHandler.addEntityToScene(packet);
    return;
  }

  if (packet.type === "move" && typeof packet.id === 'string' && packet.id !== player?.entity) {
    // console.log("Move packet received for entity", packet);
    return EntityHandler.setEntityTargetPosition(packet, 500);
  }

  if (packet.type === "despawn") {
    console.log("Despawn packet received", packet);
    return EntityHandler.removeEntity(packet.id);
  }

  if (packet.type === "block" || packet.type === "set") {
    return WorldHandler.set(packet.x, packet.y, packet.z, packet.b || packet.id);
  }

  if (Object.keys(packet).length === 1 && packet.success === true) {
    return;
    // Ignore success
  }

  if (packet.type === "punch") {
    console.log("Punch packet received", packet);
    return EntityHandler.activatePunchAnimation(packet.id, packet);
  }

  if (packet.type === "move") {
    console.log(packet.type, packet);
  }

  console.warn("Unknown packet", packet);
}

export function getPlayer() {
  return player;
}


export function getPreferredSocketType() {
  const socketType = window.location.search.includes("socket=websocket") ? "websocket" : "php";
  const preference = window.localStorage.getItem("preferred-socket");
  if (["php", "websocket"].includes(preference)) {
    return preference;
  }
  return socketType;
}

export function setPreferredSocketType(socketType) {
  if (["php", "websocket"].includes(socketType)) {
    window.localStorage.setItem("preferred-socket", socketType);
  } else {
    console.warn("Invalid socket type preference:", socketType);
  }
  return socketType;
}

