import {
  loadStorageArray,
  loadStorageObject,
  appendStorageArray,
  writeStorageObject,
  writeStorageArray,
} from "./primitives/StorageObjectStore.js";

/** @type {Record<string, string>} */
const cookieIdRecord = {};

let playerList = undefined;

export const playerCache = new Map();

export async function getNewPlayerSpawnPose(player) {
  return [0, 2, 0, 0, 0, 0].map((v, i) =>
    i < 3 ? Math.floor(i === 1 ? v : (Math.random() - 0.5) * 2 * v) : v
  );
}

export async function loadPlayerByCookieId(cookieId) {
  if (!cookieId) {
    throw new Error("Missing cookieId");
  }
  let id = cookieIdRecord[cookieId];
  if (!id) {
    const known = Object.values(cookieIdRecord);
    const list = playerList.filter((i) => !known.includes(i));
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
    if (!obj_or_id.substring(1).match(/^\d+$/)) {
      throw new Error("Invalid player ID: must contain digits only");
    }
    obj_or_id = `p${obj_or_id}`;
  }
  if (!playerList) {
    playerList = await loadStorageArray("players", "created", null);
  }
  const obj = await loadStorageObject(
    "players",
    obj_or_id.charAt(1),
    obj_or_id
  );
  if (obj && obj["cookieId"] && cookieIdRecord[obj["cookieId"]] !== obj.id) {
    cookieIdRecord[obj["cookieId"]] = obj.id;
  }
  return obj;
}

export async function createPlayer(obj) {
  let id = obj?.id || obj?.selfLoginCode;
  if (typeof id === "string" && !id.startsWith("p") && id.length > 4) {
    if (!id.match(/^\d+$/)) {
      throw new Error("Invalid player ID: must contain digits only");
    }
    id = `p${id}`;
    obj.id = id;
  } else if (typeof id !== "string" || id.length < 4) {
    throw new Error("Invalid player ID");
  }
  if (!obj?.id?.startsWith?.("p")) {
    throw new Error("Invalid player ID");
  }
  if (!playerList) {
    playerList = await loadStorageArray("players", "created", null);
  }
  if (playerList.includes(obj.id)) {
    if (await loadPlayer(obj.id)) {
      throw new Error("Player already exists");
    }
    await writeStorageArray(
      "players",
      "created",
      null,
      playerList.filter((id) => id !== obj.id)
    );
  } else {
    playerList.push(obj.id);
  }
  if (obj.pose instanceof Array) {
    if (obj.pose.length === 3) {
      obj.pose.push(0, 0, 0);
    } else if (obj.pose.length === 5) {
      obj.pose.push(0);
    }
  }
  await appendStorageArray("players", "created", null, [obj.id]);
  await writeStorageObject("players", obj.id.charAt(1), obj.id, obj);
  if (obj["cookieId"] && cookieIdRecord[obj["cookieId"]] !== obj.id) {
    cookieIdRecord[obj["cookieId"]] = obj.id;
  }
  return obj;
}

export async function savePlayer(obj) {
  let id = obj?.id || obj?.selfLoginCode;
  if (typeof id === "string" && !id.startsWith("p") && id.length > 4) {
    if (!id.match(/^\d+$/)) {
      throw new Error("Invalid player ID: must contain digits only");
    }
    id = `p${id}`;
    obj.id = id;
  } else if (typeof id !== "string" || id.length < 4 || !id.startsWith("p")) {
    throw new Error("Invalid player ID");
  }
  if (!playerList) {
    playerList = await loadStorageArray("players", "created", null);
  }
  if (!playerList.includes(obj.id)) {
    throw new Error("Player does not exist yet");
  }
  await writeStorageObject("players", obj.id.charAt(1), obj.id, obj);
  if (obj["cookieId"] && cookieIdRecord[obj["cookieId"]] !== obj.id) {
    cookieIdRecord[obj["cookieId"]] = obj.id;
  }
  return obj;
}

export async function getPlayerIdList(refresh = false) {
  if (!playerList || refresh) {
    playerList = await loadStorageArray("players", "created", null);
  }
  return playerList;
}
