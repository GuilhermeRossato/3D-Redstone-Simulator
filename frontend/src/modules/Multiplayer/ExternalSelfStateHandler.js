import * as InputHandler from '../InputHandler.js';
import * as MultiplayerHandler from '../MultiplayerHandler.js';

let sendingPosition = false;
let playerActionBuffer = [];
export let error = null;

export async function sendPlayerActionToServerEventually(action) {
    if (MultiplayerHandler.active) {
        playerActionBuffer.push(action);
    }
}

async function sendPlayerMadeActions() {
    const body = JSON.stringify({ actions: playerActionBuffer });
    playerActionBuffer = [];

    const response = await fetch('/player-made-action/', { method: 'POST', body });

    if (response.status === 400) {
        // User must have been disconnected
        window.location.reload();
        return;
    }

    const text = await response.text();

    if (text.length === 0) {
        return;
    }

    if (text.trim()[0] === '<') {
        console.error('Player made action returned HTML');
        return;
    }

    if (text === '{"success":true}') {
        return;
    }

    error = new Error('Player action returned unexpected data: ' + text);
    console.error(error);
}

let requestDebounceIndex = 0;

export function updateSelfState() {
    if (error) {
        return;
    }
    if (sendingPosition) {
        return;
    }
    if (requestDebounceIndex < 10) {
        requestDebounceIndex += 1;
        return;
    }
    if (playerActionBuffer.length === 0 && !InputHandler.dirty) {
        return;
    }
    if (InputHandler.dirty) {
        const position = InputHandler.position;
        const rotation = InputHandler.rotation;
        playerActionBuffer.push({
            type: 'move',
            x: position.x,
            y: position.y,
            z: position.z,
            yaw: rotation.yaw,
            pitch: rotation.pitch,
        });
        InputHandler.clearDirtyness();
    }
    requestDebounceIndex = 0;
    sendingPosition = true;
    if (playerActionBuffer.length > 1 && playerActionBuffer[0].type === 'move' && playerActionBuffer[1].type === 'move') {
        console.warn('Double movement');
    }
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