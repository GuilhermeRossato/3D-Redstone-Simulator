import { createStorageClient, entities, players } from "../../lib/primitives/createStorageClient.js";

export default async function setup(payload, context) {
  const { type, selfLoginCode, cookieId, replyId } = payload;
  if (type !== "setup") {
    throw new Error("Invalid setup packet type");
  }
  if (!selfLoginCode) {
    throw new Error("Missing selfLoginCode");
  }
  if (!replyId && replyId !== 0) {
    throw new Error("Missing replyId");
  }
  context.selfLoginCode = selfLoginCode;
  context.cookieId = cookieId;
  context.setupTime = Date.now();
  let player = (await players.load(1, { id: `p-${selfLoginCode}` }))[0];
  let entity = player ? await entities.load(1, { player: player.id })[0] : null;
  
  const position = [
    Math.floor(7 * Math.random()) - 3,
    2,
    Math.floor(7 * Math.random()) - 3,
  ];
  if (!player) {
    player = await players.create({
      id: `p-${selfLoginCode}`,
      cookieId,
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
    cookieId,
    responseId: payload.replyId,
    entity: entity.state,
    success: true,
  };
}
