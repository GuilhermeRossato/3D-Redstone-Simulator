import { processEvent } from "../MultiplayerHandler.js";

let requestingNextGameState = false;

async function requestNextEvent() {
    const response = await fetch('/request-next-game-state/');
    const text = await response.text();
    if (text.length === 0) {
        throw new Error('Request next game state returned empty string and status ' + response.status);
    }
    if (text[0] !== '{') {
        throw new Error(text);
    }
    const result = JSON.parse(text);
    const list = result.events;
    for (let event of list) {
        processEvent(event);
    }
}

export function updateNextGameState() {
    if (requestingNextGameState === false) {
        requestingNextGameState = true;
        requestNextEvent().then(
            () => requestingNextGameState = false,
            (err) => {
                console.log('Stopping next game state requests due to error', err.code);
                console.warn(err);
            }
        );
    }
}