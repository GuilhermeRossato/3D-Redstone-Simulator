import * as THREE from "../../libs/three.module.js";
import { scene } from "../GraphicsHandler.js";
import { setPlayerPosition } from "../InputHandler.js";
import { updateSelfState } from "./ExternalSelfStateHandler.js";
import * as EntityHandler from "../EntityHandler.js";
import * as WorldHandler from "../../world/WorldHandler.js";
import { initializeSocket, sendEvent } from "./SocketHandler.js";
import { b } from "../../utils/bezier.js";
import { createSnackbarAlert } from "../../utils/createSnackbarAlert.js";

export let active = false;

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
  if (initResponse?.success !== true) {
    createSnackbarAlert("The server did not return success", "error");
    console.log("Invalid server object:", initResponse);
    throw new Error("Server did not return success on connection setup packet");
  }
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
  // Update player position
  if (
    typeof initResponse.x === "number" &&
    typeof initResponse.y === "number" &&
    typeof initResponse.z === "number"
  ) {
    setPlayerPosition(initResponse);
  }
  // Update world in parts
  const blockStepSize =
    initResponse.blockList instanceof Array
      ? Math.min(100, Math.ceil(initResponse.blockList.length / 6))
      : 0;
  const entityStepSize =
    initResponse.entityList instanceof Array
      ? Math.min(100, Math.ceil(initResponse.entityList.length / 6))
      : 0;
  if (initResponse.entityList instanceof Array) {
    EntityHandler.removeAllEntities();
  }

  let offsets = [];
  const radius = 1;
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      for (let z = -radius; z <= 2; z++) {
        if (!offsets.find((a) => a[0] === x && a[1] === y && a[2] === z)) {
          offsets.push([x, y, z, Math.sqrt(x * x + y * y + z * z)]);
        }
      }
    }
  }
  offsets = offsets.sort((a, b) => a[3] - b[3]);
  console.log(`offsets`, offsets);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Perform server time syncronization
  const datePairList = [];
  let lastSentTime;
  for (const offset of offsets) {
    lastSentTime = new Date().getTime();
    const response = await sendEvent(
      {
        type: "sync",
        clientTime: lastSentTime,
        offset: offset.slice(0, 3),
      },
      true
    );
    if (
      typeof response.serverTime !== "number" ||
      Math.abs(response.serverTime - lastSentTime) > 120_000
    ) {
      throw new Error(
        "Server did not sent time or the client date does not match the server date"
      );
    }
    console.log(response);
    datePairList.push([lastSentTime, response.serverTime]);
    if (response.chunk) {
      console.log("Response chunk", response.chunk);
    }
    if (response.entities?.length) {
      console.log("Response entities", response.entities);
    }
  }

  const differenceList = datePairList
    .slice(datePairList.length - 3)
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

  const startResponse = await sendEvent(
    {
      type: "context",
      offset,
    },
    true
  );

  if (typeof startResponse.entity !== "object") {
    console.log("Invalid server object:", startResponse);
    throw new Error(
      "First context request did not return current player entity data"
    );
  }

  const [x, y, z] = startResponse.entity.state.position;
  const [yaw, pitch] = startResponse.entity.state.direction;

  player = startResponse.entity;

  // Update player position
  setPlayerPosition({ x, y, z, yaw, pitch });
}

export async function sendClientAction(action) {
  if (!active) {
    return;
  }
  if (action.type === "move") {
    action.x = parseFloat(action.x.toFixed(3));
    action.y = parseFloat(action.y.toFixed(3));
    action.z = parseFloat(action.z.toFixed(3));
    action.yaw = parseFloat(action.yaw.toFixed(4));
    action.pitch = parseFloat(action.pitch.toFixed(4));
  }
  if (
    ["start-breaking", "pause-breaking", "pause-breaking"].includes(action.type)
  ) {
    action.x = Math.floor(action.x);
    action.y = Math.floor(action.y);
    action.z = Math.floor(action.z);
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

window["setBlock"] = function (x, y, z, id, type) {

}


