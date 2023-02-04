import { clearDirtyness, dirty, position, rotation } from '../InputHandler.js';

let sendingPosition = false;

async function sendCurrentPositionToServer() {
    const body = JSON.stringify({
        actions: [{
            type: 'move',
            x: position.x,
            y: position.y,
            z: position.z,
            yaw: rotation.yaw,
            pitch: rotation.pitch,
        }]
    });

    clearDirtyness();

    const response = await fetch('/player-made-action/', { method: 'POST', body });

    const text = await response.text();

    if (text.length === 0) {
        return;
    }

    if (text[0] === '<') {
        console.error('Player made action returned HTML');
        return;
    }

    if (text === '{"success":true}') {
        return;
    }

    console.error('Player action returned unexpected data', text);
}

let requestDebounceIndex = 0;

export function updateSelfState() {
    if (requestDebounceIndex < 15) {
        requestDebounceIndex += 1;
    } else {
        if (!sendingPosition && dirty) {
            requestDebounceIndex -= 15;
            sendingPosition = true;
            sendCurrentPositionToServer().then(
                () => sendingPosition = false
            );
        }
    }
}