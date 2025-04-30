import {
  loadStorageArray,
  loadStorageObject,
  appendStorageArray,
  writeStorageObject,
  writeStorageArray,
} from "./lib/primitives/StorageObjectStore.js";

/** @type {Record<string, string>} */
const cookieIdRecord = {};

let playerList = undefined;

export async function getPlayerSpawnPose(player) {
  return [-5, 3, 7, 0, 0].map((v, i) =>
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

export async function loadPlayer(id) {
  if (!id) {
    return null;
  }
  if (typeof id === "string" && !id.startsWith("p") && id.length > 4) {
    if (!id.match(/^\d+$/)) {
      throw new Error("Invalid player ID: must contain digits only");
    }
    id = `p${id}`;
  }
  if (!playerList) {
    playerList = await loadStorageArray("players", "created", null);
  }
  const obj = await loadStorageObject("players", id.charAt(1), id);
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
  }
  await appendStorageArray("players", "created", null, [obj.id]);
  await writeStorageObject("players", obj.id.charAt(1), obj.id, obj);
  if (!playerList.includes(obj.id)) {
    playerList.push(obj.id);
  }
  if (obj["cookieId"] && cookieIdRecord[obj["cookieId"]] !== obj.id) {
    cookieIdRecord[obj["cookieId"]] = obj.id;
  }
  return obj;
}

export async function updatePlayer(obj) {
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
