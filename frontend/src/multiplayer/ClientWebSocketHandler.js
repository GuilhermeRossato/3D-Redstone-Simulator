
let lastBeginTime = null;
let lastStartTime = null;
let lastErrorTime = null;
let lastCloseTime = null;

const debug = true;

/** @type {undefined | WebSocket} */
let ws;

async function startWebsocketWithTimeout(endpoint = '', timeout = 0, open = () => { }, close = () => { }) {
    let resolved = false;
    return await new Promise((resolve, reject) => {
        lastBeginTime = new Date().getTime();
        const tmr = timeout && setTimeout(() => {
            const message = `Initialization timeout emitted for websocket ${resolved ? "after resolving" : "before resolving"
                }`;
            debug && console.log("[D]", message);
            if (!resolved) {
                resolved = true;
                reject(new Error(message));
            }
        }, timeout);
        debug && console.log("[D]", "Creating websocket to", endpoint);
        ws = new WebSocket(endpoint);
        ws.addEventListener("timeout", (evt) => {
            const message = `Timeout event emitted for websocket ${evt && typeof evt["message"] === "string"
                ? evt["message"]
                : "without message"
                } at phase ${evt.eventPhase} (${resolved ? "after resolving" : "before resolving"
                })`;
            debug && console.log("[D]", message);
            if (!resolved) {
                resolved = true;
                timeout && clearTimeout(tmr);
                reject(new Error(message));
            }
        });
        ws.onerror = (err) => {
            console.log("Websocket error:", err); -
                timeout && clearTimeout(tmr);
            reject(err);
        };

    })
}

function getWebsocketEndpoint() {
    let protocol = window.location.hostname === "localhost" ? "ws" : "wss";
    let host = window.location.host;
    // host = "gui-test-zone.com.br";
    return `${protocol}://${host}/3D-Redstone-Simulator`;
}

class ClientWebsocketHandle {
    state = {
        initializing: {
            active: false,
            finished: 0,
        }
    }
    constructor() {
    }

    init() {
        if (this.state.initializing.active || this.state.initializing.activating || this.state.initializing.finished) {
            throw new Error("WebSocketHandler already started")
        }
        this.state.initializing.activating = Date.now();
        startWebsocketWithTimeout();
        const [selfLoginCode, cookieId] = await Promise.all([
            getSelfLoginCode(),
            getCookieId(),
        ]);
    }

}