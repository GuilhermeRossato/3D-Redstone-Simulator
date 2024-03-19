import * as InputHandler from '../InputHandler.js';
import * as MultiplayerHandler from './MultiplayerHandler.js';

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
    if (InputHandler.flags.dirty) {
        const { x, y, z } = InputHandler.position;
        const { yaw, pitch } = InputHandler.rotation;
        playerActionBuffer.push({
            type: 'move',
            x,
            y,
            z,
            yaw,
            pitch,
        });
        InputHandler.flags.dirty = false;
    }
    requestDebounceIndex = 0;
    sendingPosition = true;
    sendPlayerMadeActions().then(
        () => sendingPosition = false,
        (err) => {
            console.error(err);
            if (!error) {
                error = err;
            }
            sendingPosition = false;
        }
    );
}