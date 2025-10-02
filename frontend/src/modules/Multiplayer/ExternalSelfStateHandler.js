import * as InputHandler from "../InputHandler.js";
import * as MultiplayerHandler from "./MultiplayerHandler.js";
import { getPlayerEntityId } from "./MultiplayerHandler.js";

let sendCount = 0;
let sendingPackets = false;
let playerActionBuffer = [];
export let error = null;
export let movement = [];

// Variable to store the last sent movement JSON string
let previousMovementText = "";

export async function sendPlayerActionToServerEventually(action) {
  if (MultiplayerHandler.flags.active) {
    playerActionBuffer.push(action);
  }
}

async function sendPlayerMadeActions() {
  if (playerActionBuffer.length > 1) {
    console.log("Sending", playerActionBuffer.length, "player actions to server");
  }
  const playerEntityId = getPlayerEntityId();
  if (!playerEntityId) {
    console.warn("No player entity ID found, cannot send actions");
    return;
  }
  while (playerActionBuffer.length) {
    const action = playerActionBuffer.shift();
    if (action.id !== playerEntityId) {
      action.id = playerEntityId;
    }
    await MultiplayerHandler.sendClientAction(action);
  }
  if (sendCount === 0 && playerEntityId) {
    sessionStorage.setItem("last-entity-id", playerEntityId);
    localStorage.setItem("last-entity-id", playerEntityId);
  }
  if (movement.length) {
    const currentMovementText = JSON.stringify(movement);
    if (currentMovementText !== previousMovementText) {
      previousMovementText = currentMovementText;
      await MultiplayerHandler.sendClientAction({
        type: "move",
        pose: movement.slice(0, 6),
        id: playerEntityId,
      });
      // console.log("Sent movement to server:", movement);
      if (sendCount > 2 && sendCount % 2 === 0) {
        localStorage.setItem("last-player-pose", movement.join(","));
        sessionStorage.setItem("last-player-pose", movement.join(","));
      }
    }
    movement.length = 0;
  }
  sendCount++;
}

let requestDebounceIndex = 0;
let requestDebounceLength = 20;

export function updateSelfState(frame) {
  if (error) {
    return;
  }
  if (requestDebounceIndex < requestDebounceLength) {
    requestDebounceIndex++;
    return;
  }
  if (sendingPackets) {
    return;
  }
  if (playerActionBuffer.length === 0 && !InputHandler.flags.dirty) {
    return;
  }
  requestDebounceIndex = 0;
  if (InputHandler.flags.dirty && MultiplayerHandler.flags.connected) {
    const { x, y, z } = InputHandler.position;
    const { yaw, pitch } = InputHandler.rotation;
    movement = [
      parseFloat(x.toFixed(5)),
      parseFloat(y.toFixed(5)),
      parseFloat(z.toFixed(5)),
      parseFloat(yaw.toFixed(6)),
      parseFloat(pitch.toFixed(6)),
      0
    ];
    InputHandler.flags.dirty = false;
  }
  sendingPackets = true;
  sendPlayerMadeActions().then(
    () => (sendingPackets = false),
    (err) => {
      console.error(err);
      if (!error) {
        error = err;
      }
      sendingPackets = false;
    }
  );
}
