import { setPlayerPosition } from "../InputHandler.js";
import { updateSelfState } from "./ExternalSelfStateHandler.js";
import * as EntityHandler from "../EntityHandler.js";
import * as WorldHandler from "../../world/WorldHandler.js";
import { initializeSocket, sendEvent } from "./SocketHandler.js";
import { createSnackbarAlert } from "../../utils/createSnackbarAlert.js";
import { g } from "../../utils/g.js";
import { sleep } from "../../utils/sleep.js";
import { scene } from "../GraphicsHandler.js";

export let active = false;

export const flags = {
  connected: false,
};

const playerEntityRecord = {};

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
 *   props: {
 *    yaw: number;
 *    pitch: number;
 *  }
 * }} PlayerObject */

/** @type {undefined | PlayerObject} */
let player;

async function processServerChunkResponse(responses, blockLookup) {
  const chunks = (responses instanceof Array) ? responses : [responses];
  if (!chunks || (Array.isArray(chunks) && chunks.length === 0)) {
    return;
  }
  for (const chunk of chunks) {
    if (!chunk.blocks || Object.keys(chunk.blocks).length === 0) {
      continue;
    }
    console.log('Initializing chunk at', chunk.cx, chunk.cy, chunk.cz, 'with', Object.keys(chunk.blocks).length, 'initial blocks');
    const instance = WorldHandler.getChunk(chunk.cx, chunk.cy, chunk.cz, true);
    for (const y in chunk.blocks) {
      for (const x in chunk.blocks[y]) {
        for (const z in chunk.blocks[y][x]) {
          let id = chunk.blocks[y][x][z];
          
          if (id === 0||id === null||id === undefined||id===false) {
            continue;
          }
          instance.set(x, y, z, id);
        }
      }
    }
    if (!instance.scene) {
      console.log('Creating scene for chunk', instance);
      instance.assignTo(scene);
      instance.requestMeshUpdate();
    }
  }
}

async function processServerRegionResponse(region) {
  const entities = region.entities;
  if (!entities || (Array.isArray(entities) && entities.length === 0)) {
    return;
  }
  if (!Array.isArray(entities)) {
    throw new Error("Received entities in invalid format, expected an array of entities");
  }
  console.log('Create the entities', entities);
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

export async function load() {
  try {
    await initializeSocket();
    await performLogin();
    active = true;
  } catch (err) {
    active = false;
    err.message = `Multiplayer failed to start: ${err.message}`;
    throw err;
  }
  return active;
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

export async function getSelfLoginCode() {
  let selfLoginCode = window.localStorage.getItem("self-login-code");
  if (!selfLoginCode) {
    const yearDigit = new Date().getFullYear().toString()[3];
    const monthPair = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const datePair = new Date().getDate().toString().padStart(2, "0");
    selfLoginCode = monthPair + yearDigit + Math.floor(Math.random() * 8999999 + 1000000).toString() + datePair;
    window.localStorage.setItem("self-login-code", selfLoginCode);
  }
  return selfLoginCode;
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

async function performLogin() {
  const snack = await createSnackbarAlert("Performing login...", "info");
  let cookieId = await getCookieId();
  const sentId = await getSelfLoginCode();
  const initResponse = await sendEvent({
    type: "setup",
    selfLoginCode: sentId,
    cookieId: cookieId || localStorage.getItem("last-cookie-id"),
  }, true);
  console.log("Setup response", initResponse);
  if (initResponse?.code === 'already-logged-in') {
    snack("You are already logged in...");
    await sleep(2000);
  }
  if (initResponse?.success !== true) {
    snack();
    createSnackbarAlert("The server did not return success", "error");
    console.log("Invalid server object:", initResponse);
    throw new Error("Server did not return success on connection setup packet");
  }
  if (initResponse?.selfLoginCodes && initResponse?.selfLoginCodes !== sentId) {
    console.warn("Server returned different selfLoginCodes, updating local storage");
    localStorage.setItem("self-login-code", initResponse.selfLoginCodes);
  }
  flags.connected = true;
  // Update cookie id
  if (typeof initResponse.cookieId === "string" && initResponse.cookieId !== cookieId) {
    localStorage.setItem("last-cookie-id", initResponse.cookieId);
    console.log("Updating cookieId");
    document.cookie = `id=${initResponse.cookieId}; expires=${new Date(new Date().getTime() + 31_536_000_000).toUTCString()}`;
    cookieId = initResponse.cookieId;
  }
  snack("Getting context...");
  await sleep(200);
  const ctx = await sendEvent({
    type: "context",
    variant: "spawn",
  }, true);
  console.log('Context response', ctx);

  if (!ctx || !ctx.player || !ctx.chunks) {
    snack();
    createSnackbarAlert("Context request failed", "error");
    throw new Error("Received invalid context packet");
  }

  if (ctx.regions) {
    for (const region of ctx.regions) {
      if (!region || !region.id) {
        console.warn("Invalid region received from server:", region);
        continue;
      }
      if (!region.list || !region.list.length) {
        continue;
      }
      console.log("Processing region", region.id, "with", region.list.length, "entities");
      await processServerRegionResponse(region);
    }
  }

  const blockLookup = ctx.blocks;

  WorldHandler.addBlockDefinitions(blockLookup);

  g("player", (player = ctx.player));

  const list = [];
  if (ctx.regions) {
    for (const item of ctx.regions) {
      list.push(item.id);
    }
  }
  if (ctx.chunks) {
    for (const item of ctx.chunks) {
      list.push(item.id);
    }
  }
  const groupSize = Math.ceil(list.length / 9);
  const groups = list.length < 9 ? list.map(i => [i]) : Array.from({
    length: 9
  }, (_, index) => list.slice(index * groupSize, index + 1 === 9 ? list.length : (index + 1) * groupSize));
  // Perform server time syncronization
  const syncPairs = [];
  let maxOffset = -Infinity;
  let minOffset = Infinity;
  for (let i = 0; i < 9; i++) {
    const client = Date.now();
    const response = await sendEvent({
      type: "sync",
      client,
      subjects: groups[i],
    }, true);
    const server = response?.server;
    if (!server || typeof server !== "number" || isNaN(server) || server <= 1000 || Math.abs(server - client) > 180_000) {
      throw new Error("Invalid or missing time values on sync: Server did not sent time or the client date does not match the server date");
    }
    const delta = client-server;
    syncPairs.push(delta);
    maxOffset = Math.max(maxOffset, delta);
    minOffset = Math.min(minOffset, delta);
    if (response.results?.length) {
      for (const state of response.results) {
        if (!state || !state.id) {
          console.warn("Invalid state received from server:", state);
          continue;
        }
        if (state.id.startsWith("r")) {
          await processServerRegionResponse(state);
        } else {
          await processServerChunkResponse(state, blockLookup);
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
  }, true);

  console.log('Spawned result entity:', spawn.entity);

  if (typeof spawn?.player?.pose !== "object") {
    console.log("Invalid server object (Missing player pose)", spawn);
    throw new Error("First context request did not return current player position data");
  }

  g("player", (player = spawn.player));

  // Update player position
  const pose = spawn?.player?.pose || ctx?.player?.pose;
  if (pose instanceof Array && typeof pose[0] === "number" && !isNaN(pose[0]) && typeof pose[1] === "number" && !isNaN(pose[1]) && typeof pose[2] === "number" && !isNaN(pose[2])) {
    console.log("Setting player", spawn.player.id, "position to", pose, "(locally)");
    setPlayerPosition(pose);
  }
}

export async function sendClientAction(action) {
  if (!active) {
    return;
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
  await sendEvent(action);
}

export function update() {
  if (active && player) {
    updateSelfState();
  }
}

export async function processServerPacket(packet) {
  // console.log("Received packet", packet);
  if (packet.type === "spawn") {
    console.log("Spawn packet received", packet);
    EntityHandler.addEntityToScene(packet);
    return;
  }

  if (packet.type === "move" && typeof packet.entity === 'string' && packet.entity !== player?.id) {
    // console.warn("Move packet received", packet);
    if (EntityHandler.entityRecord[packet.entity]) {
      console.log("Move packet received for known entity", packet);
      return EntityHandler.setEntityTargetPosition(packet, 0, packet.time);
    }
    console.log("Move packet received for unknown entity", packet);
    return {
      type: "request-entity",
      id: packet.entity,
    };
  }

  if (packet.type === "despawn") {
    console.log("Despawn packet received", packet);

    return EntityHandler.removeEntity(packet.entity.id);
  }

  if (packet.type === "block") {
    return WorldHandler.set(packet.x, packet.y, packet.z, packet.id);
  }

  if (Object.keys(packet).length === 1 && packet.success === true) {
    return;
    // Ignore success
  }

  if (packet.type === 'move') {
    console.log(packet.type, packet);
  }

  console.warn("Unknown packet", packet);
}

export function getPlayer() {
  return player;
}

window["setBlock"] = function (x, y, z, id, type) { }
  ;
