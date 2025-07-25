import {
  getSelfLoginCode,
  getCookieId,
  processServerPacket,
  flags,
} from "./MultiplayerHandler.js";

const debug = true;
const verbose = false;

function onSocketClose() {
  flags.connected = false;
}

/** @type {undefined | WebSocket} */
let ws;

let closeReason = null;
let lastBeginTime = null;
let lastStartTime = null;
let lastErrorTime = null;
let lastCloseTime = null;
let isSocketClosed = false;

let responseResolveRecord = {};

function getWebsocketEndpoint() {
    const protocol = window.location.hostname === "localhost" ? "ws" : "wss";
    const host = window.location.host;
    // host = "gui-test-zone.com.br";
    return `${protocol}://${host}/3D-Redstone-Simulator`;
}

async function createSocket() {
  if (lastBeginTime && new Date().getTime() - lastBeginTime < 1000) {
    debug && console.log("[D]", "Previous start time was recent:");
    debug &&
      console.log(
        "[D]",
        "Last begin was",
        new Date().getTime() - lastBeginTime,
        "ms before and 1000 ms of artificial delay will be added before connection"
      );
    await new Promise((resolve) => setTimeout(() => resolve, 1000));
  }
  lastBeginTime = new Date().getTime();
  let [selfLoginCode, cookieId] = await Promise.all([
    getSelfLoginCode(),
    getCookieId(),
  ]);
  if (selfLoginCode.split("|").length > 3) {
    debug && console.log("[D]", "Self login code is too long, limiting it");
    selfLoginCode = selfLoginCode.split("|").slice(0, 3).join("|");
  }
  return await new Promise((resolve, reject) => {
    const base = getWebsocketEndpoint();
    const url = `${base}/ws/${selfLoginCode}/${cookieId ? cookieId + "/" : ""}`;
    debug && console.log("[D]", "Creating websocket to", url);
    ws = new WebSocket(url);
    ws.onerror = (err) => {
      console.log("Websocket error:", err);
    };

    // @ts-ignore
    window["socket"] = window["ws"] = ws;
    window["messages"] = [];

    let resolved = false;
    const timeoutTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const message = "Timeout while waiting for socket to initialize";
        debug && console.log("[D]", message);
        closeReason = new Error(message);
        reject(closeReason);
      }
    }, 7000);
    ws.addEventListener("timeout", (evt) => {
      isSocketClosed = true;
      onSocketClose();
      clearTimeout(timeoutTimer);
      const message = `Timeout event emitted for websocket ${evt && typeof evt["message"] === "string"
          ? evt["message"]
          : "without message"
        } at phase ${evt.eventPhase} (${resolved ? "after resolving" : "before resolving"
        })`;
      debug && console.log("[D]", message);
      if (!resolved) {
        resolved = true;
        closeReason = new Error(message);
        reject(closeReason);
      }
    });

    ws.addEventListener("error", (evt) => {
      if (evt?.eventPhase === 2) {
        console.log(
          "Websocket was received by the listener but the communication failed"
        );
        // @ts-ignore
        console.log("Event", ...([evt?.reason, evt?.cause, evt?.message].filter(Boolean)), evt);
      } else {
        console.log("Websocket error event:", evt);
      }
      isSocketClosed = true;
      onSocketClose();
      clearTimeout(timeoutTimer);
      const now = new Date().getTime();
      const message = `Error event emitted for websocket ${evt && typeof evt["message"] === "string"
          ? evt["message"]
          : "without message"
        } at phase ${evt.eventPhase} (${resolved ? "after resolving" : "before resolving"
        }),  ${now - lastBeginTime} ms since begining connection and ${now - lastErrorTime
        } ms since last error event`;
      lastErrorTime = new Date().getTime();
      debug && console.log("[D]", message);
      debug && console.log("[D]", "Error event object:", evt);

      if (!resolved) {
        resolved = true;
        closeReason = new Error(message);
        reject(closeReason);
      }
    });

    ws.addEventListener("close", () => {
      console.log("Socket closed");
      isSocketClosed = true;
      onSocketClose();
      clearTimeout(timeoutTimer);
      const now = new Date().getTime();
      const message = `Socket close event emitted ${now - lastBeginTime
        } ms since begining connection, ${now - lastStartTime
        } ms since last connection start, ${now - lastCloseTime
        } ms since last connection close`;
      debug && console.log("[D]", message);
      closeReason = new Error(message);
      lastCloseTime = now;
      if (!resolved&&reject) {
        debug && console.log("[D]", "Resolving socket close event");
        resolved = true;
        reject(closeReason);
      }
    });

    ws.addEventListener("open", () => {
      debug && console.log("Web socket opened");
      clearTimeout(timeoutTimer);
      if (resolved) {
        debug &&
          console.log(
            "[D]",
            "Socket open event emitted but socket function has resolved already. Attempting to close socket."
          );
        try {
          isSocketClosed = true;
          onSocketClose&&onSocketClose();
          ws.close();
        } catch (err) {
          // Ignore
        }
        return;
      }
      isSocketClosed = false;
      // Delay to confirm nothing will fail
      setTimeout(() => {
        if (resolved) {
          debug &&
            console.log(
              "[D]",
              "Socket open timeout after open event emitted but socket function has resolved already. Attempting to close socket."
            );
          try {
            isSocketClosed = true;
            onSocketClose();
            ws.close();
          } catch (err) {
            // Ignore
          }
          return;
        }
        resolved = true;
        resolve(ws);
      }, 250);
    });

    ws.addEventListener("message", (event) => {
      let obj;
      try {
        obj =
          typeof event.data === "string" && event.data[0] === "{"
            ? JSON.parse(event.data)
            : event.data;
      } catch (err) {
        debug &&
          console.log("[D]", "Failed to parse data from socket:", err.message);
        debug && console.log("[D]", "Event data:", { data: event.data });
        ws.close();
        return;
      }
      window["messages"].push(obj);
      if (window["messages"].length > 32) {
        window["messages"].shift();
      }
      verbose && console.log("[V]", "Received message:", obj);
      if (responseResolveRecord[obj.responseId]) {
        verbose && console.log("[D]", "Routed server packet to response");
        responseResolveRecord[obj.responseId].resolve(obj);
        delete responseResolveRecord[obj.responseId];
        return;
      }
      verbose &&
        console.log("[D]", "Routed server packet to process server event");
      processServerPacket(obj);
    });
  });
}

let isStartingSocket = false;

export async function initializeSocket() {
  console.log("Initializing multiplier socket...");
  let socket;
  if (isStartingSocket) {
    throw new Error(
      "Cannot initialize socket because it is already being started"
    );
  }
  isStartingSocket = true;
  const startTime = new Date().getTime();
  try {
    socket = await createSocket();
    isStartingSocket = false;
  } catch (err) {
    isStartingSocket = false;
    console.log("Failed while starting socket for the first time:");
    console.log(err);
    const has = localStorage.getItem("has-socket-connected-on-the-past");
    if (has === "true" || has === "1") {
      console.log(
        "Socket has connected on the past so multiplayer setup will attempt to reconnect once regardless of previous error"
      );
    } else {
      console.log(
        "No indication that the socket has connected previously was found"
      );
      if (new Date().getTime() - startTime > 4000) {
        console.log(
          "The socket failed after a while so multiplayer setup will fail"
        );
        throw err;
      }
      console.log(
        "First socket connection failed quickly so multiplayer setup will attempt to reconnect once regardless of previous error"
      );
    }
  }
  if (!socket) {
    isStartingSocket = true;
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      socket = await createSocket();
      localStorage.setItem("has-socket-connected-on-the-past", "true");
      isStartingSocket = false;
    } catch (err) {
      isStartingSocket = false;
      throw err;
    }
  }
  if (!socket) {
    throw new Error("Unexpectedly missing socket after creation");
  }
}
let isFirstLarge = true;
// let lastSendTime = new Date().getTime();
let replyId = 0;
export async function sendEvent(obj, waitReply = false) {
  if (!obj.type) {
    throw new Error("Missing type in object");
  }
  if (!ws) {
    throw new Error("No socket connection stabilished to send event");
  }
  if (isSocketClosed && !isStartingSocket) {
    debug && console.log("[D]", "Restarting socket");
    isStartingSocket = true;
    try {
      ws = await createSocket();
      isStartingSocket = false;
    } catch (err) {
      debug && console.log("[D]", "Failed while restarting socket:", err.stack);
      isStartingSocket = false;
      throw err;
    }
  }
  for (let i = 0; i < 30 && isStartingSocket; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (isStartingSocket || !ws || isSocketClosed) {
    throw new Error("No socket connection stabilished after restart");
  }
  return await new Promise((resolve, reject) => {
    try {
      if (waitReply) {
        obj.replyId = replyId;
        responseResolveRecord[replyId] = {
          resolve,
          time: new Date().getTime(),
        };
        replyId++;
      }
      let text = JSON.stringify(obj);
      let length = text.length;
      if (length > 1500) {
        if (isFirstLarge) {
          isFirstLarge = false;
        } else {
          //text = text.substring(0, 1500) + ('A').repeat(length - 1500); length = text.length;
          console.log('Sending', length);
        }
      }
      ws.send(text);
      if (!waitReply) {
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
}
