import {
  createPlayer,
  getPlayerIdList,
  loadPlayer,
  loadPlayerByCookieId,
  savePlayer,
  playerCache,
} from "../../lib/PlayerStorage.js";


/**
 * The "setup" is the first client packet and is responsible for setting up a player session.
 */

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

export function createSelfLoginCode() {
    const yearDigit = new Date().getFullYear().toString().split('').pop(); // 1
    const monthPair = (new Date().getMonth() + 1).toString().padStart(2, "0"); // 2
    const datePair = new Date().getDate().toString().padStart(2, "0"); // 2
    const randomStr = Math.floor(Math.random() * 8999999 + 1000000).toString(); // 7
    return [monthPair, yearDigit, randomStr, datePair].join('');
}

export default async function setup(payload, ctx) {
  const selfLoginCode = payload.selfLoginCode || payload.selfLoginCodes || ctx.selfLoginCodes || ctx.selfLoginCode;
  if (payload.type !== "setup") {
    throw new Error("Invalid setup packet type");
  }
  let id = selfLoginCode ? selfLoginCode : createSelfLoginCode();
  if (id.length > 5+7)  {
    console.log("Trimming id to 5+7 characters from", id.length, "chars.");
    id = id.substring(0, 5+7);
    console.log("Trimmed id to", [id]);
  }
  if (payload.cookieId) {
    ctx.cookieId = payload.cookieId;
  } else {
    console.log("Creating a new cookie id for user", [id]);
    ctx.cookieId = createCookieId(id);
  }
  let player = await loadPlayer(id);
  if (!player) {
    console.log("Could not find a existing player");
    if (ctx.cookieId) {
      player = await loadPlayerByCookieId(ctx.cookieId);
      if (player && player.id && player.id !== id) {
        console.log('Warning:',
          `Mismatching player id: ${JSON.stringify(
            player.id
          )} != ${JSON.stringify(id)}`
        );
        player = null;
        ctx.cookieId = null; // Reset cookieId if player id does not match
      }
      if (!player) {
        console.log("Could not find a existing player by cookie id");
      }
    }
  }
  if (!id.startsWith("p")) {
    id = `p${id.substring(1)}`;
  }
  let updated = false;
  if (!player) {
    console.log("Creating a new player with id", [id]);
    const list = await getPlayerIdList(true);
    player = await createPlayer({
      id,
      cookieId: payload.cookieId || ctx.cookieId,
      created_at: Date.now(),
      name: `Player${list.length}`,
      entities: [],
    });
    console.log("Created player", [player.name], "at", player.pose.slice(0, 3));
  }
  if (!player) {
    throw new Error("Failed to create or load player");
  }
  if (!player.cookieId && (payload.cookieId || ctx.cookieId)) {
    player.cookieId = payload.cookieId || ctx.cookieId;
    updated = true;
  }
  if (!player.cookieId) {
    player.cookieId = createCookieId(id || player.selfLoginCode);
    updated = true;
  }
  if (!playerCache[id]) playerCache[id] = [];
  playerCache[id].push(ctx);
  ctx.player = player;
  ctx.setup_at = Date.now();
  ctx.cookieId = player.cookieId;
  console.log("Finished setup for player", [player.name], "id", [player.id]);
  if (ctx.player.entity) {
    console.log("Player already has an entity:", ctx.player.entity);
  }
  if (!ctx.player.entities||!(ctx.player.entities instanceof Array)) {
    ctx.player.entities = [];
    updated = true;
  }
  if (updated) {
    await savePlayer(player);
  }
  return {
    success: true,
    selfLoginCode: ctx.selfLoginCode,
    cookieId: ctx.cookieId,
    player,
    session: payload.session || ctx.session || null,
  };
}
