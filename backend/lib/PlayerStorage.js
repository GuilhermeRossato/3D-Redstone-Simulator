import {
  loadStorageArray,
  loadStorageObject,
  appendStorageArray,
  writeStorageObject,
  writeStorageArray,
} from "./primitives/StorageObjectStore.js";

/** @type {Record<string, string>} */
const cookieIdRecord = {};
/** @type {Record<string, any>} */
const playerIdRecord = {};

let playerIdList = undefined;

export const playerCache = new Map();

export function getNewPlayerSpawnPose(player) {
  return [0, 2, 0, 0, 0, 0].map((v, i) =>
    i < 3 ? Math.floor(i === 1 ? v : (Math.random() - 0.5) * 3 * v) : v
  );
}

export function getPlayerContextPose(payload, ctx) {
  let pose = [payload.pose, ctx.pose, ctx.player.pose].find(p => (p instanceof Array && p.length >= 3 && typeof p[0] == 'number' && !isNaN(p[0]) && typeof p[1] == 'number' && !isNaN(p[1]) && typeof p[2] == 'number' && !isNaN(p[2])));
  if (ctx.player?.entities?.length && (!pose || !pose.length || pose.length < 3 || isNaN(pose[0]) || isNaN(pose[1]) || isNaN(pose[2]))) {
//    pose = ctx.player.entities[0]?.pose;
  }
  if (!pose || !pose.length || pose.length < 3 || isNaN(pose[0]) || isNaN(pose[1]) || isNaN(pose[2])) {
    pose = getNewPlayerSpawnPose(ctx.player.name);
  }
  while (pose.length < 6) {
    pose.push(0);
  }
  return pose;
}

export async function loadPlayerByCookieId(cookieId) {
  if (!cookieId) {
    throw new Error("Missing cookieId");
  }
  let id = cookieIdRecord[cookieId];
  if (!id) {
    const known = Object.values(cookieIdRecord);
    const list = playerIdList.filter((i) => !known.includes(i));
    const filtered = list.splice(Math.max(0, list.length - 50));
    for (const id of filtered) {
      const obj = await loadPlayer(id);
      if (obj && obj.id && obj["cookieId"] === cookieId) {
        cookieIdRecord[cookieId] = id;
        return obj;
      }
    }
  }
  return await loadPlayer(id);
}

export async function loadPlayer(obj_or_id) {
  if (!obj_or_id) {
    return null;
  }
  if (
    typeof obj_or_id === "object" &&
    typeof obj_or_id.id === "string" &&
    obj_or_id.id.length > 4
  ) {
    obj_or_id = obj_or_id.id;
  }
  if (
    typeof obj_or_id === "string" &&
    !obj_or_id.startsWith("p") &&
    obj_or_id.length > 4
  ) {
    obj_or_id = `p${obj_or_id}`;
  }
  if (!playerIdList) {
    playerIdList = await getPlayerIdList(true);
  }
  if (!playerIdList.includes(obj_or_id)) {
    console.log('Ignoring player load because player id is not in list:', obj_or_id);
    return null;
  }
  const obj = await loadStorageObject(
    "players",
    obj_or_id.charAt(1),
    obj_or_id
  );
  if (obj && obj["cookieId"] && cookieIdRecord[obj["cookieId"]] !== obj.id) {
    cookieIdRecord[obj["cookieId"]] = obj.id;
  }
  if (obj && obj.id && playerIdRecord[obj.id] !== obj) {
    playerIdRecord[obj.id] = obj;
  }
  return obj;
}

export async function createPlayer(obj) {
  if (!String(obj.id).startsWith("p")) {
    obj.id = `p${obj.id}`;
  }
  if (obj.id.length <= 5 || obj.id > 10) {
    throw new Error("Invalid player id");
  }
  if (!playerIdList) {
    playerIdList = await getPlayerIdList(true);
  }
  if (playerIdList.includes(obj.id)) {
    throw new Error(`Player already exists: ${obj.id}`);
  }
  if (obj.pose && obj.pose instanceof Array) {
    if (obj.pose.length === 3) {
      obj.pose.push(0, 0, 0);
    } else if (obj.pose.length === 5) {
      obj.pose.push(0);
    }
  }
  playerIdList.push(obj.id);
  const count = await appendStorageArray("players", "created", null, [obj.id]);
  console.log("Created a player at index", count, "with id", obj.id);
  await writeStorageObject("players", obj.id.charAt(1), obj.id, obj);
  if (obj["cookieId"] && cookieIdRecord[obj["cookieId"]] !== obj.id) {
    cookieIdRecord[obj["cookieId"]] = obj.id;
  }
  if (obj && obj.id && playerIdRecord[obj.id] !== obj) {
    playerIdRecord[obj.id] = obj;
  }
  return obj;
}

export async function savePlayer(obj) {
  let id = obj?.id;
  if (!playerIdList.includes(id)) {
    throw new Error("Player does not exist yet");
  }
  if (typeof id === "string" && !id.startsWith("p") && id.length > 4) {
    if (!id.match(/^\d+$/)) {
      throw new Error("Invalid player ID: must contain digits only");
    }
    id = `p${id}`;
    obj.id = id;
  } else if (typeof id !== "string" || id.length < 4 || !id.startsWith("p")) {
    throw new Error("Invalid player ID");
  }
  if (!playerIdList) {
    playerIdList = await getPlayerIdList(true);
  }
  if (!playerIdList.includes(obj.id)) {
    throw new Error("Player does not exist yet");
  }
  if (obj.created_at && !obj.created) {
    obj.created = obj.created_at;
    delete obj.created_at;
  }
  if (obj.updated_at) {
    obj.updated = obj.updated_at;
    delete obj.updated_at;
  }
  await writeStorageObject("players", obj.id.charAt(1), obj.id, obj);
  if (obj["cookieId"] && cookieIdRecord[obj["cookieId"]] !== obj.id) {
    cookieIdRecord[obj["cookieId"]] = obj.id;
  }
  if (obj && obj.id && playerIdRecord[obj.id] !== obj) {
    playerIdRecord[obj.id] = obj;
  }
  return obj;
}

export async function getPlayerIdList(refresh = false) {
  if (!playerIdList || refresh) {
    playerIdList = await loadStorageArray("players", "created", null);
  }
  return playerIdList;
}
