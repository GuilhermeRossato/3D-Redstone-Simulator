import {
  createPlayer,
  getPlayerIdList,
  getPlayerSpawnPose,
  loadPlayer,
  loadPlayerByCookieId,
  updatePlayer,
} from "../../PlayerStorage.js";

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

export default async function setup(payload, context) {
  const { type, selfLoginCode, replyId } = payload;
  if (type !== "setup") {
    throw new Error("Invalid setup packet type");
  }
  if (!selfLoginCode) {
    throw new Error("Missing selfLoginCode");
  }
  if (
    typeof selfLoginCode !== "string" ||
    selfLoginCode.length <= 4 ||
    selfLoginCode.length >= 32 ||
    selfLoginCode.match(/\D/)
  ) {
    throw new Error("Invalid selfLoginCode");
  }
  if (!replyId && replyId !== 0) {
    throw new Error("Missing replyId");
  }
  context.selfLoginCode = selfLoginCode;
  if (payload.cookieId) {
    if (
      (payload.cookieId[payload.cookieId.length - 1] !== selfLoginCode[0] ||
        payload.cookieId[0] !== selfLoginCode[selfLoginCode.length - 1]) &&
      Math.random() > 0.9
    ) {
      throw new Error("Invalid cookieId");
    }
    context.cookieId = payload.cookieId;
  } else {
    console.log("Creating a new cookie id for user", [selfLoginCode]);
    context.cookieId = createCookieId(selfLoginCode);
  }
  context.setupTime = Date.now();
  const id = selfLoginCode;
  let player = await loadPlayer(id);
  if (!player) {
    console.log("Could not find a existing player by self login code");
    if (context.cookieId) {
      player = await loadPlayerByCookieId(context.cookieId);
      if (player && player.id && player.id !== id) {
        throw new Error(
          `Mismatching player id: ${JSON.stringify(
            player.id
          )} != ${JSON.stringify(id)}`
        );
      }
      if (!player) {
        console.log("Could not find a existing player by cookie id");
      }
    }
  }

  if (!player) {
    const pose = await getPlayerSpawnPose();
    const list = await getPlayerIdList(true);
    player = await createPlayer({
      id,
      cookieId: payload.cookieId || context.cookieId,
      lastLogin: Date.now(),
      name: `Player${list.length}`,
      pose,
      entity: {
        id: `e${id.substring(1)}`,
        pose,
        path: [pose].slice(1),
        health: 20,
        maxHealth: 20,
        target: "",
      },
    });
    console.log("Created player", [player.name], "at", player.pose.slice(0, 3));
  }

  if (!player.cookieId && (payload.cookieId || context.cookieId)) {
    player.cookieId = createCookieId(selfLoginCode || player.selfLoginCode);
    context.cookieId = player.cookieId;
    await updatePlayer(player);
  }

  context.player = player;
  context.selfLoginCode = selfLoginCode;
  context.cookieId = player.cookieId;

  return {
    success: true,
    selfLoginCode,
    cookieId: payload.cookieId,
    responseId: payload.replyId,
  };
}
