import { setPlayerPosition } from "../InputHandler.js";
import { updateSelfState } from "./ExternalSelfStateHandler.js";
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

const playerEntityRecord = {};

let playerEntityList = [];

const sd = () => setDebugInfo(
  "MultiplayerHandler",
  `${player.id} ${player.entity} (self)`,
  `${playerEntityList?.length} others`,
  playerEntityList?.join?.('\n')
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
 *   entity: string;
 *   props: {
 *    yaw: number;
 *    pitch: number;
 *  }
 * }} PlayerObject */

/** @type {undefined | PlayerObject} */
let player;

export function getPlayerEntityId() {
  if (!player || !player.entity) {
    console.warn("Player entity is not initialized");
    return null;
  }
  return player.entity;
}

export async function load() {
  try {
    console.log("Initializing socket...");
    await initializeSocket();
    await performLogin();
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

async function processServerChunkResponse(responses, list = []) {
  console.log('Processing chunk response', responses);
  const chunks = (responses instanceof Array) ? responses : [responses];
  if (!chunks || (Array.isArray(chunks) && chunks.length === 0)) {
    return;
  }
  for (const chunk of chunks) {
    if (!chunk.blocks || Object.keys(chunk.blocks).length === 0) {
      continue;
    }
    if (chunk.id && (typeof chunk.cx !== "number" || typeof chunk.cy !== "number" || typeof chunk.cz !== "number")) {
      const c = (chunk.id.match(/-?\d+/g) || []).map(i => parseInt(i));
      if (c.length === 3 && c.every(i => !isNaN(i))) {
        chunk.cx = c[0];
        chunk.cy = c[1];
        chunk.cz = c[2];
      }
    }
    const c = Object.entries(chunk.blocks).map(b => Object.entries(b).map(c => Object.entries(c).length).flat()).flat().length;
    console.log('Initializing chunk at', chunk.cx, chunk.cy, chunk.cz, 'with', c, 'initial blocks');
    const instance = WorldHandler.getChunk(chunk.cx, chunk.cy, chunk.cz, true);
    for (const y in chunk.blocks) {
      for (const x in chunk.blocks[y]) {
        for (const z in chunk.blocks[y][x]) {
          const id = chunk.blocks[y][x][z];
          if (id === 0 || id === null || id === undefined || id === false) {
            continue;
          }
          //console.log('  Block', id, 'at', x, y, z, 'in chunk', chunk.id);
          instance.set(x, y, z, id);
          list && list.push([id, chunk.cx * 16 + Number(x), Number(y), chunk.cz * 16 + Number(z)].join('  '));
        }
      }
    }
    if (!instance.scene) {
      console.log('Creating scene for chunk', instance);
      instance.assignTo(scene);
      instance.requestMeshUpdate();
    }
  }
  return list;
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

  playerEntityRecord[player.id] = {
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

export async function storedPlayerId(id) {
  if (id) {
    window.localStorage.setItem("self-login-code", id.startsWith('p') ? id : `p${id}`);
  }
  return window.localStorage.getItem("self-login-code") || "";
}

export async function getCookieId() {
  const cookieString = document.cookie;
  if (typeof cookieString === "string") {
    const cookie = (cookieString.split(";").find((c) => c.trim().startsWith("id=")) || "").trim();
    if (cookie) {
      return cookie.substring(cookie.indexOf("=") + 1);
    }
  }
  return "";
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

async function performLogin() {
  //const snack = await createSnackbarAlert("Performing login...", "info");
  let cookieId = await getCookieId();
  let sentId = await storedPlayerId();
  let startPose = (sessionStorage.getItem('last-player-pose') || '0').split(',').map(i => parseFloat(i))
  if (startPose.length < 3 || startPose.slice(0, 6).some(num => isNaN(num))) {
    startPose = (localStorage.getItem('last-player-pose') || '0').split(',').map(i => parseFloat(i));
  }
  if (startPose.length < 3 || startPose.slice(0, 6).some(num => isNaN(num))) {
    startPose = undefined;
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
  const pkt = await sendEvent({
    type: "setup",
    playerId: sentId,
    cookieId: cookieId || localStorage.getItem("last-cookie-id"),
    session: sessionStorage.getItem("last-session-id") || "",
    pose: startPose,
  }, true);

  console.log("Setup response", pkt);

  if (pkt?.code === 'already-logged-in') {
    //snack("You are already logged in...");
    await sleep(2000);
  }

  if (!pkt || pkt.success !== true) {
    //snack();
    createSnackbarAlert("The server did not return success", "error");
    console.log("Invalid server object:", pkt);
    throw new Error("Server did not return success on connection setup packet");
  }

  if (pkt?.playerId && pkt?.playerId !== sentId && pkt?.playerId !== `p${sentId}`) {
    console.warn("Server returned different playerId, updating local storage");
    await storedPlayerId(pkt.playerId);
    sentId = await storedPlayerId();
    if (sentId !== pkt.playerId) {
      throw new Error("Failed to store player id");
    }
  }

  flags.connected = true;

  // Update cookie id
  if (typeof pkt.cookieId === "string" && pkt.cookieId !== cookieId) {
    localStorage.setItem("last-cookie-id", pkt.cookieId);
    console.log("Updating cookieId");
    document.cookie = `id=${pkt.cookieId}; expires=${new Date(new Date().getTime() + 31_536_000_000).toUTCString()}`;
    cookieId = pkt.cookieId;
  }

  //snack("Getting context...");

  const blockTypeTimes = loadLocalBlockTypeTimes();

  const ctx = await sendEvent({
    type: "context",
    pose: startPose,
    blockTypeTimes,
    session: sessionStorage.getItem("last-session-id") || "",
    entityId: sessionStorage.getItem("last-entity-id") || "",
  }, true);

  console.log('Context response', ctx);

  if (!ctx || !ctx.player || !ctx.chunks || !ctx.regions) {
    //snack();
    createSnackbarAlert("Context request failed", "error");
    throw new Error("Received invalid context packet");
  }

  if (ctx.blocks) {
    WorldHandler.addBlockDefinitions(ctx.blocks);
  }

  const pending = [];

  for (const chunk of ctx.chunks) {
    if (!chunk || !chunk.id) {
      console.warn("Invalid Chunk received from server:", chunk);
      continue;
    }
    pending.push(chunk.id);
  }

  for (const region of ctx.regions) {
    if (!region || !region.id) {
      console.warn("Invalid region received from server:", region);
      continue;
    }
    pending.push(region.id);
  }

  console.log("Pending chunks or regions to load:", pending.length);

  if (!ctx.blocks || !Object.keys(ctx.blocks).length) {
    throw new Error("No block definitions received from server");
  }

  console.log("Applying window[\"player\"] for debugging");
  g("player", (player = ctx.player));

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
      throw new Error("Invalid or missing time values on sync: Server did not sent time or the client date does not match the server date");
    }
    const delta = client - server;
    syncPairs.push(delta);
    maxOffset = Math.max(maxOffset, delta);
    minOffset = Math.min(minOffset, delta);
    if (response.results?.length) {
      for (const state of response.results) {
        if (!state || !state.id) {
          console.warn("Skipping invalid state received from server:", state);
          continue;
        }
        if (state.id.startsWith("r")) {
          //console.log("Processing region", state.id, "from sync response entities", state.entities);
          await processServerRegionResponse(state);
        } else {
          console.log("Processing chunk", state.id, "from sync response entities", state);

          await processServerChunkResponse(state);
        }
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
  console.log('offset:', offset, 'ms');
  // console.log(diffs.map((a) => new Date(a).toISOString().substring(14)), offset);
  const spawn = await sendEvent({
    type: "spawn",
    variant: "initial",
    offset,
    entityId: ctx.entity?.id || "",
    pose: startPose,
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

  g("player", (player = spawn.player));

  player.entity = spawn.entity.id;
  playerEntityList = spawn?.playerEntityList || [];
  sd();
  /*
  // Update player position
  const pose = spawn?.entity?.pose || ctx?.entity?.pose;
  if (pose instanceof Array && typeof pose[0] === "number" && !isNaN(pose[0]) && typeof pose[1] === "number" && !isNaN(pose[1]) && typeof pose[2] === "number" && !isNaN(pose[2])) {
    if (JSON.stringify(pose) === '[0,2,0,0,0,0]') {
      console.log("Ignored default position")
    } else {
      console.log("Setting player", spawn.player.id, "position to", pose, "(locally)");
      setPlayerPosition(pose);
    }
  }
    */

  if (spawn.entities?.length) {
    // console.log("Initializing", spawn.entities?.length, "entities:");
    spawn.entities.forEach(entity => {
      // console.log("Adding spawned entity", entity.id);
      EntityHandler.addEntityToScene(entity);
    });
  }
  g("clist", clist);
  console.log('window.clist has', clist.length, 'blocks initialized from server');
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

window["setBlock"] = function (x, y, z, id, type) { }
  ;
