import * as THREE from "../../libs/three.module.js";
import { scene } from "../GraphicsHandler.js";
import { setPlayerPosition } from "../InputHandler.js";
import { updateSelfState } from "./ExternalSelfStateHandler.js";
import * as EntityHandler from "../EntityHandler.js";
import * as WorldHandler from "../../world/WorldHandler.js";
import { initializeSocket, sendEvent } from "./SocketHandler.js";
import { createSnackbarAlert } from "../../utils/createSnackbarAlert.js";
import { g } from "../../utils/g.js";

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

async function processServerChunkResponse(chunk) {}

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
    selfLoginCode =
      monthPair +
      yearDigit +
      Math.floor(Math.random() * 8999999 + 1000000).toString() +
      datePair;
    window.localStorage.setItem("self-login-code", selfLoginCode);
  }
  return selfLoginCode;
}

export async function getCookieId() {
  const cookieString = document.cookie;
  if (typeof cookieString === "string") {
    const cookie = (
      cookieString.split(";").find((c) => c.trim().startsWith("id=")) || ""
    ).trim();
    if (cookie) {
      return cookie.substring(cookie.indexOf("=") + 1);
    }
  }
  return "";
}

async function performLogin() {
  createSnackbarAlert("Performing login...", "info");
  const cookieId = await getCookieId();
  const initResponse = await sendEvent(
    {
      type: "setup",
      selfLoginCode: await getSelfLoginCode(),
      cookieId: cookieId || localStorage.getItem("last-cookie-id"),
    },
    true
  );
  console.log("Setup response", initResponse);
  if (initResponse?.success !== true) {
    createSnackbarAlert("The server did not return success", "error");
    console.log("Invalid server object:", initResponse);
    throw new Error("Server did not return success on connection setup packet");
  }
  flags.connected = true;
  // Update cookie id
  if (
    typeof initResponse.cookieId === "string" &&
    initResponse.cookieId !== cookieId
  ) {
    localStorage.setItem("last-cookie-id", initResponse.cookieId);
    console.log("Updating cookieId");
    document.cookie = `id=${initResponse.cookieId}; expires=${new Date(
      new Date().getTime() + 31_536_000_000
    ).toUTCString()}`;
  }
  const ctx = await sendEvent(
    {
      type: "context",
      variant: "spawn",
    },
    true
  );

  g("player", (player = ctx.player));

  const watching =
    ctx.watching instanceof Array
      ? ctx.watching
      : Object.keys(ctx.watching);

  console.log(`Chunks:`, JSON.stringify(watching));

  await new Promise((resolve) => setTimeout(resolve, 250));

  // Perform server time syncronization
  const syncPairs = [];
  for (let i = 0; i < 9 || watching.length; i++) {
    const client = Date.now();
    const response = await sendEvent(
      {
        type: "sync",
        client,
        chunks: watching,
        first: i === 0,
        last: !(i < 9 || watching.length),
      },
      true
    );
    const server = response?.server;
    if (
      !server ||
      typeof server !== "number" ||
      isNaN(server) ||
      server <= 1000 ||
      Math.abs(server - client) > 180_000
    ) {
      throw new Error(
        "Invalid or missing time values on sync: Server did not sent time or the client date does not match the server date"
      );
    }
    syncPairs.push([client, server]);
    for (let j = 0; j < response.chunks.length; j++) {
      const chunk = response.chunks[j];
      const k = watching.findIndex(
        (c) => [chunk.cx, chunk.cy, chunk.cz].join(",") === c
      );
      if (k === -1) {
        console.warn("Chunk not found", chunk);
        continue;
      }
      watching.splice(k, 1);
      await processServerChunkResponse(chunk);
    }
  }

  const differenceList = syncPairs
    .slice(syncPairs.length - 3)
    .map((pair) => pair[0] - pair[1]);
  if (differenceList.length === 0 || differenceList.some((d) => isNaN(d))) {
    throw new Error(
      "Failed to retrieve valid time difference list on server syncronization"
    );
  }
  const offset = Math.floor(
    differenceList.reduce((p, c) => p + c, 0) / differenceList.length
  );

  console.log(
    differenceList.map((a) => new Date(a).toISOString().substring(15)),
    offset
  );

  const spawn = await sendEvent(
    {
      type: "spawn",
    },
    true
  );

  console.log(`startResponse`, spawn);

  if (typeof spawn?.player?.pose !== "object") {
    console.log("Invalid server object:", spawn);
    throw new Error(
      "First context request did not return current player position data"
    );
  }

  g("player", (player = spawn.player));

  // Update player position
  const pose = spawn?.player?.pose || ctx?.player?.pose;
  if (
    pose instanceof Array &&
    typeof pose[0] === "number" &&
    !isNaN(pose[0]) &&
    typeof pose[1] === "number" &&
    !isNaN(pose[1]) &&
    typeof pose[2] === "number" &&
    !isNaN(pose[2])
  ) {
    setPlayerPosition(pose);
  }
}

export async function sendClientAction(action) {
  if (!active) {
    return;
  }
  if (
    [
      "punch",
      "start-breaking",
      "stop-breaking",
      "finish-breaking",
      "place",
      "set",
      "remove",
    ].includes(action.type)
  ) {
    if (action.pos instanceof Array) {
      action.pos = action.pos.map((a,i) => i < 3 ? Math.floor(a) : a);
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
  if (packet.event === "spawn") {
    EntityHandler.addEntityToScene(packet.entity);
    return;
  }

  if (packet.event === "move" && packet.entity.id !== player?.id) {
    if (EntityHandler.entityRecord[packet.entity.id]) {
      return EntityHandler.setEntityTargetPosition(
        packet.entity,
        500,
        packet.time
      );
    }
    return {
      type: "request-entity",
      id: packet.entity,
    };
    return;
  }

  if (packet.event === "despawn") {
    return EntityHandler.removeEntity(packet.entity.id);
  }

  if (packet.event === "block") {
    return WorldHandler.set(packet.x, packet.y, packet.z, packet.id);
  }

  if (Object.keys(packet).length === 1 && packet.success === true) {
    return; // Ignore success
  }

  console.warn("Unknown packet", packet);
}

export function getPlayer() {
  return player;
}

window["setBlock"] = function (x, y, z, id, type) {};
