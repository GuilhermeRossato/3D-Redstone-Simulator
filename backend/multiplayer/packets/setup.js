import {
  createPlayer,
  getPlayerIdList,
  getNewPlayerSpawnPose,
  loadPlayer,
  loadPlayerByCookieId,
  savePlayer,
  playerCache,
} from "../../lib/PlayerStorage.js";
import close from "./close.js";

function createCookieId(selfLoginCode) {
  if (!selfLoginCode) {
    selfLoginCode = Math.random().toString(36).substring(2);
  }
  const yearDigit = new Date().getFullYear().toString()[3];
  const monthPair = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const datePair = new Date().getDate().toString().padStart(2, "0");
  return (
    selfLoginCode[selfLoginCode.length - 1] +
    monthPair +
    yearDigit +
    Math.floor(Math.random() * 8999999 + 1000000).toString() +
    datePair +
    selfLoginCode[0]
  );
}

export async function createSelfLoginCode() {
  const yearDigit = new Date().getFullYear().toString()[3];
  const monthPair = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const datePair = new Date().getDate().toString().padStart(2, "0");
  return monthPair +
    yearDigit +
    Math.floor(Math.random() * 8999999 + 1000000).toString() +
    datePair;
}

export default async function setup(payload, ctx) {
  const selfLoginCode = payload.selfLoginCode || payload.selfLoginCodes || ctx.selfLoginCodes || ctx.selfLoginCode;
  if (payload.type !== "setup") {
    throw new Error("Invalid setup packet type");
  }
  const ids = selfLoginCode ? selfLoginCode.split('|').map(a => a.trim()).filter(Boolean) : [await createSelfLoginCode()];
  let currentId;
  for (const id of ids) {
    if (!playerCache[id]?.loggedIn) {
      currentId = id;
      break;
    }
    if (payload.forceLogoff || playerCache[id]?.unfocused || playerCache[id]?.idle) {
      console.log("Player", id, "is logged in already and will be logged off.");
      try {
        await playerCache[id]?.send({ type: 'close', reason: 'relogin' });
        await close({ type: 'close', reason: 'relogin' }, playerCache[id]);
        currentId = id;
        break;
      } catch (e) {
        console.error("Error sending close event to existing player:", e);
      }
    }
    console.log("Player", id, "is already logged in. Creating a new id.");
    currentId = '';
    break;
  }
  if (!currentId) {
    currentId = await createSelfLoginCode();
  }
  if (payload.cookieId) {
    ctx.cookieId = payload.cookieId;
  } else {
    console.log("Creating a new cookie id for user", [currentId]);
    ctx.cookieId = createCookieId(currentId);
  }
  let player = await loadPlayer(currentId);
  if (!player) {
    console.log("Could not find a existing player");
    if (ctx.cookieId) {
      player = await loadPlayerByCookieId(ctx.cookieId);
      if (player && player.id && player.id !== currentId) {
        console.log('Warning:',
          `Mismatching player id: ${JSON.stringify(
            player.id
          )} != ${JSON.stringify(currentId)}`
        );
        player = null;
        ctx.cookieId = null; // Reset cookieId if player id does not match
      }
      if (!player) {
        console.log("Could not find a existing player by cookie id");
      }
    }
  }

  let updated = false;

  if (!player) {
    const pose = await getNewPlayerSpawnPose();
    const list = await getPlayerIdList(true);
    player = await createPlayer({
      id: currentId,
      cookieId: payload.cookieId || ctx.cookieId,
      lastLogin: Date.now(),
      name: `Player${list.length}`,
      pose,
      entity: "",
    });
    console.log("Created player", [player.name], "at", player.pose.slice(0, 3));
  }

  if (!player.cookieId && (payload.cookieId || ctx.cookieId)) {
    player.cookieId = payload.cookieId || ctx.cookieId;
    updated = true;
  }
  if (!player.cookieId) {
    player.cookieId = createCookieId(currentId || player.selfLoginCode);
    updated = true;
  }
  if (updated) {
    await savePlayer(player);
  }
  playerCache[currentId] = {
    loggedIn: true,
  }
  ctx.player = player;
  ctx.selfLoginCode = currentId;
  ctx.selfLoginCodes = [...ids.filter(id => id !== currentId), currentId].join('|');
  ctx.setupTime = Date.now();
  ctx.cookieId = player.cookieId;
  ctx.pid = player.id;
  return {
    success: true,
    selfLoginCode: ctx.selfLoginCode,
    selfLoginCodes: ctx.selfLoginCodes,
    cookieId: ctx.cookieId,
    player,
  };
}
