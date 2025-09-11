import {
  createPlayer,
  getPlayerIdList,
  loadPlayer,
  loadPlayerByCookieId,
  savePlayer,
  playerCache,
} from "../../lib/PlayerStorage.js";
import { createPlayerId, expectedPlayerIdLength } from "../../utils/createPlayerId.js";


/**
 * Initializes a player.
 * 
 * The "setup" is the first client packet and is responsible for setting up a player session.
 */

function createCookieId(playerId) {
  if (!playerId) {
    playerId = Math.random().toString(36).substring(2);
  }
  const yearDigit = new Date().getFullYear().toString()[3];
  const monthPair = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const datePair = new Date().getDate().toString().padStart(2, "0");
  return (
    playerId[playerId.length - 1] +
    monthPair +
    yearDigit +
    Math.floor(Math.random() * 8999999 + 1000000).toString() +
    datePair +
    playerId[0]
  );
}

export default async function setup(payload, ctx) {
  const playerId = payload.playerId || payload.selfLoginCode || ctx.selfLoginCodes || ctx.playerId;
  if (payload.type !== "setup") {
    throw new Error("Invalid setup packet type");
  }
  ctx.playerId = playerId ? playerId : createPlayerId();
  if (ctx.playerId && ctx.playerId.startsWith('p')) {
    ctx.playerId = ctx.playerId.substring(1);
  }
  if (ctx.playerId.length > expectedPlayerIdLength+4) {
    console.log("Trimming id to 5+7 characters from", ctx.playerId.length, "chars.");
    ctx.playerId = ctx.playerId.substring(0, expectedPlayerIdLength+4);
    console.log("Trimmed id to", [ctx.playerId]);
  }
  if (payload.cookieId) {
    ctx.cookieId = payload.cookieId;
  } else {
    console.log("Creating a new cookie id for user", [ctx.playerId]);
    ctx.cookieId = createCookieId(ctx.playerId);
  }
  let player = await loadPlayer(ctx.playerId);
  if (!player) {
    console.log("Could not find an existing player with id", [ctx.playerId]);
    if (!ctx.playerId.startsWith('p')) {
      player = await loadPlayer(`p${ctx.playerId}`);
      if (!player) {
        player = await loadPlayer(`p${ctx.playerId.substring(1)}`);
        if (player && player.id) {
          console.log('Info: Merging player id to', [player.id]);
          ctx.playerId = player.id;
        }
      }
    }
    if (player && player.id) {
      ctx.playerId = player.id;
    }
  }
  if (!player && ctx.cookieId) {
    try {
      if (ctx.cookieId) {
        player = await loadPlayerByCookieId(ctx.cookieId);
        if (player && player.id && player.id !== ctx.playerId && 'p'+ctx.playerId === player.id) {
          console.log('Info: Merging player id to', [player.id]);
          ctx.playerId = player.id;
        } else if (player && player.id && player.id !== ctx.playerId && 'p'+ctx.playerId.substring(1) === player.id) {
          console.log('Info: Merging player id to', [player.id]);
          ctx.playerId = player.id;
        }
        if (player && player.id && player.id !== ctx.playerId) {
          console.log('Warning:',
            `Mismatching player id: ${JSON.stringify(
              player.id
            )} != ${JSON.stringify(ctx.playerId)}`
          );
          player = null;
          ctx.cookieId = null; // Reset cookieId if player id does not match
        }
        if (!player) {
          console.log("Could not find a existing player by cookie id");
        }
      }
    } catch (err) {
      console.error("Error loading player by cookie id:", err);
    }
  }
  if (!ctx.playerId.startsWith("p")) {
    ctx.playerId = player && player.id && player.id.startsWith('p') ? player.id : `p${ctx.playerId.substring(0)}`;
  }
  let updated = false;
  if (player && player.id && player.id !== ctx.playerId && 'p'+ctx.playerId !== player.id && player.id.startsWith('p')) {
    ctx.playerId = player.id;
  }
  if (!player||!ctx.playerId) {
    console.log("Creating a new player with id", [ctx.playerId]);
    ctx.playerId = `p${Math.random().toString(36).substring(2, 10)}`;
    const list = await getPlayerIdList(true);
    const playerObj = {
      id: ctx.playerId,
      cookieId: payload.cookieId || ctx.cookieId,
      created: Date.now(),
      name: `Player${list.length}`,
      entities: [],
    };
    if (list.includes(ctx.playerId)) {
      console.log('Player exist but not saved:', ctx.playerId);
      player = await savePlayer(playerObj)
    } else {
      player = await createPlayer(playerObj);
      console.log("Created player", [player.name]);
    }
  }
  if (!player) {
    throw new Error("Failed to create or load player");
  }
  if (!player.cookieId && (payload.cookieId || ctx.cookieId)) {
    player.cookieId = payload.cookieId || ctx.cookieId;
    updated = true;
  }
  if (!player.cookieId) {
    player.cookieId = createCookieId(ctx.playerId || player.playerId);
    ctx.cookieId = player.cookieId;
    updated = true;
  }
  if (!playerCache[ctx.playerId]) playerCache[ctx.playerId] = [];
  playerCache[ctx.playerId].push(ctx);
  ctx.player = player;
  ctx.cookieId = player.cookieId;
  console.log("Finished setup for player", [player.name], "id", [player.id]);
  if (ctx.player.entity) {
    console.log("Player already has an entity:", ctx.player.entity);
  }
  if (!ctx.player.entities || !(ctx.player.entities instanceof Array)) {
    ctx.player.entities = [];
    updated = true;
  }
  const playerIdList = await getPlayerIdList();
  if (!playerIdList.includes(ctx.playerId)) {
    playerIdList.push(ctx.playerId);
    updated = true;
  }
  if (updated) {
    await savePlayer(player);
  }
  return {
    success: true,
    playerId: ctx.playerId,
    cookieId: ctx.cookieId,
    player,
    //session: payload.session || ctx.session || null,
  };
}
