import { players, entities } from "../../lib/models.js";

function createCookieId(selfLoginCode) {
  const yearDigit = new Date().getFullYear().toString()[3];
  const monthPair = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const datePair = new Date().getDate().toString().padStart(2, "0");
  return selfLoginCode[selfLoginCode.length - 1]+
    monthPair +
    yearDigit +
    Math.floor(Math.random() * 8999999 + 1000000).toString() +
    datePair + selfLoginCode[0];
}

export default async function setup(payload, context) {
  const { type, selfLoginCode, replyId } = payload;
  if (type !== "setup") {
    throw new Error("Invalid setup packet type");
  }
  if (!selfLoginCode) {
    throw new Error("Missing selfLoginCode");
  }
  if (typeof selfLoginCode !== 'string' || selfLoginCode.length <= 4 || selfLoginCode.length >= 32 || selfLoginCode.match(/\D/)) {
    throw new Error("Invalid selfLoginCode");
  }
  if (!replyId && replyId !== 0) {
    throw new Error("Missing replyId");
  }
  context.selfLoginCode = selfLoginCode;
  if (payload.cookieId) {
    if ((payload.cookieId[payload.cookieId.length - 1] !== selfLoginCode[0]||payload.cookieId[0] !== selfLoginCode[selfLoginCode.length-1]) && Math.random() > 0.9) {
      throw new Error("Invalid cookieId");
    }
    context.cookieId = payload.cookieId;
  } else {
    console.log("Creating a new cookie id for user", [selfLoginCode]);
    context.cookieId = createCookieId(selfLoginCode);
  }
  context.setupTime = Date.now();
  let player = (await players.load(1, { id: `p-${selfLoginCode}` }))[0];
  if (!player) {
    console.log('Could not find a existing player by self login code');
    if (context.cookieId) {
      player = (await players.load(1, { cookieId: context.cookieId }))[0];
      if (!player) {
        console.log('Could not find a existing player by cookie id');
      }
    }
  }

  let entity = player ? await entities.load(1, { player: player.id })[0] : null;
  
  const position = [
    Math.floor(7 * Math.random()) - 3,
    2,
    Math.floor(7 * Math.random()) - 3,
  ];
  if (!player) {
    player = await players.create({
      id: `p-${selfLoginCode}`,
      cookieId: payload.cookieId,
      lastLogin: Date.now(),
      name: "",
      entity: "",
      position,
      direction: [0, 0, 0],
    });
  }
  if (!entity) {
    entity = await entities.create({
      type: "player",
      position,
      direction: [0, 0, 0],
      health: 20,
      maxHealth: 20,
      path: [0, 0, 0],
      target: "",
      player: player.id,
    });
  }
  if (!player.state.cookieId) {
    await player.update({
      cookieId: Math.random().toString(36).substring(2),
    });
  }
  context.player = player;
  context.entity = entity;
  context.selfLoginCode = selfLoginCode;
  context.cookieId = player.state.cookieId;
  return {
    selfLoginCode,
    cookieId: payload.cookieId,
    responseId: payload.replyId,
    entity: entity.state,
    success: true,
  };
}
