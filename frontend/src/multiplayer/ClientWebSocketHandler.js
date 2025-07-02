
let lastBeginTime = null;
let lastStartTime = null;
let lastErrorTime = null;
let lastCloseTime = null;

const debug = true;

/** @type {undefined | WebSocket} */
let ws;

async function startWebsocketWithTimeout(endpoint = '', timeout = 0, onClose = () => { }, onMessage = (data) => {}) {
    const buffered = [];
    const bufferer = (event)  => {
      let obj;
      try {
        obj =
          typeof event.data === "string" && (event.data[0] === "{"||event.data[0] === "[")
            ? JSON.parse(event.data)
            : event.data;
      } catch (err) {
        debug &&
          console.log("[D]", "Failed to parse data from socket:", err.message);
        debug && console.log("[D]", "Event data:", { data: event.data });
        throw err;
      }
      buffered.push(obj);
    };
    let resolved = false;
    let closed = false;
    let failed = false;
    await new Promise((resolve, reject) => {
        lastBeginTime = new Date().getTime();
        const tmr = timeout && setTimeout(() => {
            failed = true;
            const message = `Initialization timeout emitted for websocket at state ${JSON.stringify({resolved, closed})}`;
            debug && console.log("[D]", message);
            if (!closed) {
              closed = true;
              try {
                onClose && onClose();
              } catch (err) {
                console.log('Error in onClose callback:', err);
              }
            }
            if (!resolved) {
                resolved = true;
                reject(new Error(message));
            }
        }, timeout);
        debug && console.log("[D]", "Creating websocket to", endpoint);
        ws = new WebSocket(endpoint);
          
      ws.addEventListener("close", () => {
        failed = true;
        timeout && clearTimeout(tmr);
        console.log("Socket closed at state:", JSON.stringify({resolved, closed}));
        if (!closed) {
          closed = true;
          try {
            onClose && onClose();
          } catch (err) {
            console.log('Error in onClose callback:', err);
          }
        }
        const now = new Date().getTime();
        const message = `Socket close event emitted ${now - lastBeginTime
          } ms since begining connection, ${now - lastStartTime
          } ms since last connection start`;
        debug && console.log("[D]", message);
        if (!resolved) {
            resolved = true;
            reject(new Error(message));
        }
      });
      ws.addEventListener("timeout", (evt) => {
        failed = true;
        timeout && clearTimeout(tmr);
          const message = `Timeout event emitted for websocket ${evt && typeof evt["message"] === "string"
                  ? evt["message"]
                  : "without message"
              } at phase ${evt.eventPhase} at state ${JSON.stringify({resolved, closed})}`;
          debug && console.log("[D]", message);
          if (!closed) {
            closed = true;
            try {
              onClose && onClose();
            } catch (err) {
              console.log('Error in onClose callback:', err);
            }
          }
          if (!resolved) {
              resolved = true;
              reject(new Error(message));
          }
      });
      ws.addEventListener("error", (evt) => {
        failed = true;
        timeout && clearTimeout(tmr);
          const message = `Websocket error event emitted ${evt && typeof evt["message"] === "string"
                  ? evt["message"]
                  : "without message"
              } at phase ${evt?.eventPhase === 2 ? '2 (received by server but communication failed)': evt?.eventPhase} at state ${JSON.stringify({resolved, closed})}`;
          debug && console.log("[D]", message);
          debug && console.log("[D]", "Error event object:", evt);
          if (!closed) {
            closed = true;
            try {
              onClose && onClose();
            } catch (err) {
              console.log('Error in onClose callback:', err);
            }
          }
          if (!resolved) {
              resolved = true;
              reject(new Error(message));
          }
      });
        ws.onerror = (evt) => {
          failed = true;
          timeout && clearTimeout(tmr);
            const message = `Websocket direct error event emitted ${evt && typeof evt["message"] === "string"
              ? evt["message"]
              : "without message"
          } at phase ${evt?.eventPhase === 2 ? '2 (received by server but communication failed)': evt?.eventPhase} at state ${JSON.stringify({resolved, closed})}`;
      debug && console.log("[D]", message);
      debug && console.log("[D]", "Error event object:", evt);
      if (!closed) {
        closed = true;
        try {
          onClose && onClose();
        } catch (err) {
          console.log('Error in onClose callback:', err);
        }
      }
      if (!resolved) {
          resolved = true;
          reject(new Error(message));
      }
    }
    ws.addEventListener("message", bufferer);
    ws.addEventListener("open", () => {
      debug && console.log("[D]", "Web socket opened");
      timeout && clearTimeout(tmr);
      const openedUnexpectedly = resolved || closed;
      setTimeout(() => {
        if (openedUnexpectedly || resolved || closed || failed) {
            debug &&
              console.log(
                "[D]",
                "Socket open event emitted", openedUnexpectedly ? "but the creation was in an unexpected state." : closed || failed ? 'but the creation has failed shortly after' : 'but the creation process was already finished'
              );
              debug && console.log('[D]', 'Attempting to close socket...');
              try {
                ws.close();
              } catch (err) {
                if (!closed) {
                  console.log('Error closing socket in unexpected state:', debug ? '': err.message);
                  debug && console.error('[D]', err);
                }
              }
              if (!closed) {
                closed = true;
                try {
                  onClose && onClose();
                } catch (err) {
                  console.log('Error in onClose callback:', err);
                }
              }
              if (!resolved) {
                  resolved = true;
                  reject(new Error('Socket open event emitted unexpectedly'));
              }
        }
        debug && console.log("[D]", "Socket creation finished successfully (after open event)");
        resolved = true;
        resolve();
      }, 500);
    });
  });
  if (buffered.length) {
    debug && console.log("[D]", "Buffered",buffered.length, "chunks during initialization.");
    for (const data of buffered) {
      try {
        onMessage(data);
      } catch (err) {
        console.log('Error in onMessage callback:', err);
      }
    }
    buffered.length = 0;
  }
  function sendMessageEvent(event) {

  }
  ws.removeEventListener("message", bufferer);
  ws.addEventListener("message", (event) => {
    let obj;
    try {
      bufferer(event);
      obj = buffered.pop();
    } catch (err) {
      debug &&
        console.log("[D]", "Failed to parse data from socket:", err.message);
      debug && console.log("[D]", "Event data:", { data: event?.data });
      ws.close();
      return;
    }
  });
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