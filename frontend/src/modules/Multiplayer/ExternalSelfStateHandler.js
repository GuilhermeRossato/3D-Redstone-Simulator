import * as InputHandler from "../InputHandler.js";
import * as MultiplayerHandler from "./MultiplayerHandler.js";

let sendingPosition = false;
let playerActionBuffer = [];
export let error = null;

export async function sendPlayerActionToServerEventually(action) {
  if (MultiplayerHandler.active) {
    playerActionBuffer.push(action);
  }
}

async function sendPlayerMadeActions() {
  const promises = [];
  while (playerActionBuffer.length) {
    const action = playerActionBuffer.pop();
    promises.push(MultiplayerHandler.sendClientAction(action));
  }
  await Promise.all(promises);
}

let requestDebounceIndex = 0;

export function updateSelfState() {
  if (error) {
    return;
  }
  if (sendingPosition) {
    return;
  }
  if (requestDebounceIndex < 5) {
    requestDebounceIndex += 1;
    return;
  }
  if (playerActionBuffer.length === 0 && !InputHandler.flags.dirty) {
    return;
  }
  if (InputHandler.flags.dirty && MultiplayerHandler.flags.connected) {
    // console.log('Sending player position');
    const { x, y, z } = InputHandler.position;
    const { yaw, pitch } = InputHandler.rotation;
    const list = [x, y, z, yaw, pitch];
    playerActionBuffer.push({
      type: "move",
      pose: list,
    });
    InputHandler.flags.dirty = false;
    localStorage.setItem("last-player-pose", list.join(","));
  }
  requestDebounceIndex = 0;
  sendingPosition = true;
  sendPlayerMadeActions().then(
    () => (sendingPosition = false),
    (err) => {
      console.error(err);
      if (!error) {
        error = err;
      }
      sendingPosition = false;
    }
  );
}
