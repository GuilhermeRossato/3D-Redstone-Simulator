import { setDebugInfo } from "../../foreground/DebugInfo.js";
import {
  getPlayerId,
  getCookieId,
  processServerPacket,
  flags,
  MultiplayerHandler,
  getPreferredSocketType,
  setPreferredSocketType,
  setPlayerId,
  setCookieId,
  setSessionId,
} from "./MultiplayerHandler.js";

const debug = true;
const verbose = false;

function onSocketClose() {
  flags.connected = false;
}

/** @type {undefined | WebSocket} */
let ws;

let closeReason = null;
let lastCreateSocketStartTime = null;
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

async function createPhpSocket() {
  console.log("Creating PHP socket...");
  ws = null;
  const obj = {
    type: "php",
    send: async (data, callback) => {
      if (typeof data === "object") {
        data = JSON.stringify(data);
      }
      // console.log("Sending data through PHP socket:", data);
      const full = "/3D-Redstone-Simulator/backend-php/api/socket/send.php";
      const params = [
        [`playerId`, MultiplayerHandler.playerId],
        [`cookieId`, MultiplayerHandler.cookieId],
        [`sessionId`, MultiplayerHandler.sessionId],
      ].filter(param => param[1]).map(param => `${encodeURIComponent(param[0])}=${encodeURIComponent(param[1])}`);
      const extra = params.length ? `?${params.join("&")}` : "";
      const r = await fetch(full + extra, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      });
      const text = await r.text();
      let obj;
      try {
        obj = text.startsWith('{') ? JSON.parse(text) : text;
        if (typeof obj === "object" && obj !== null && obj.type !== "error" && !obj.error) {
          if (obj.playerId && obj.playerId !== MultiplayerHandler.playerId) {
            console.warn("Received player ID in PHP socket response that does not match current player ID:", obj.playerId, MultiplayerHandler.playerId);
            MultiplayerHandler.playerId = setPlayerId(obj.playerId);
          } else if (obj.cookieId && obj.cookieId !== MultiplayerHandler.cookieId) {
            console.warn("Received response from PHP socket without cookie ID or with matching cookie ID, which may cause issues with multiple connections:", obj.cookieId, MultiplayerHandler.cookieId);
            MultiplayerHandler.cookieId = setCookieId(obj.cookieId);
          } else if (obj.sessionId && obj.sessionId !== MultiplayerHandler.sessionId) {
            console.warn("Received response from PHP socket with different session id:", obj.sessionId, MultiplayerHandler.sessionId);
            MultiplayerHandler.sessionId = setSessionId(obj.sessionId);
          }
        }
      } catch (err) {
        obj = text;
      }
      if (callback) {
        callback(obj);
      }
      return obj;
    },
  };
  return obj;
}

async function createSocket() {
  let loopCount = 0;

  let elapsedSinceLastStart;
  do {
    elapsedSinceLastStart = lastCreateSocketStartTime ? new Date().getTime() - lastCreateSocketStartTime : NaN;
    debug && console.log("[D]", "Previous start time is", isNaN(elapsedSinceLastStart) ? "not defined" : elapsedSinceLastStart, "ms old");
    if (isNaN(elapsedSinceLastStart)) {
      debug && console.log("[D]", "No previous start time, proceeding to create socket");
      break;
    }
    if (elapsedSinceLastStart > 15_000) {
      debug && console.log("[D]", "Previous start time is old:", elapsedSinceLastStart, "ms, proceeding to create socket");
      break;
    }
    debug && console.log("[D]", "Previous start time is recent, waiting before retrying to create socket (loop count " + loopCount + ")");
    loopCount++;
    await new Promise((resolve) => setTimeout(() => resolve, 1000));
  } while (true);

  lastCreateSocketStartTime = new Date().getTime();

  if (MultiplayerHandler.playerId) {
    debug && console.log("[D]", "Creating socket for player id:", MultiplayerHandler.playerId);
  } else {
    debug && console.log("[D]", "No player ID found when creating socket (sending empty player id)");
  }
  const prefered = getPreferredSocketType();
  if (prefered === "php") {
    debug && console.log("[D]", "Preferred socket type is PHP, using PHP socket");
    return await createPhpSocket();
  }
  if (prefered === "websocket") {
    debug && console.log("[D]", "Preferred socket type is Websocket, using Websocket");
    return await createWebsocket();
  }
  throw new Error(`Invalid preferred socket type: ${prefered}`);
}
async function createWebsocket() {

  return await new Promise((resolve, reject) => {
    const base = getWebsocketEndpoint();
    const playerId = getPlayerId();
    const cookieId = getCookieId();
    if (playerId.startsWith("/")) {
      throw new Error("Cannot use player id for websocket");
    }
    debug && console.log("[D]", "Using player id:", playerId);

    const url = `${base}/ws/${playerId}/${cookieId ? cookieId + "/" : ""}`;
    debug && console.log("[D]", "Creating websocket to", url);
    ws = new WebSocket(url);
    ws.onerror = (err) => {
      isSocketClosed = true;
      console.log("Websocket error:", err);
      setPreferredSocketType("php");
      onSocketClose();
      reject(new Error("Failed to connect to websocket, switched to PHP socket"));
    }

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
        }),  ${now - lastCreateSocketStartTime} ms since begining connection and ${now - lastErrorTime
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
      setDebugInfo("Multiplayer", "Disconnected");
      isSocketClosed = true;
      onSocketClose();
      clearTimeout(timeoutTimer);
      const now = new Date().getTime();
      const message = `Socket close event emitted ${now - lastCreateSocketStartTime
        } ms since begining connection, ${now - lastCreateSocketStartTime
        } ms since last connection start, ${now - lastCloseTime
        } ms since last connection close`;
      debug && console.log("[D]", message);
      closeReason = new Error(message);
      lastCloseTime = now;
      if (!resolved && reject) {
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
          onSocketClose && onSocketClose();
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
  if (isStartingSocket) {
    throw new Error(
      "Cannot initialize socket because it is already being started"
    );
  }
  console.log("Starting socket init...");
  isStartingSocket = true;

  const attemptSocketCreation = async (isFirstCreation) => {
    try {
      ws = await createSocket();
      console.log(isFirstCreation ? "Socket init successfully" : "Socket retry succeeded");
      isStartingSocket = false;
    } catch (err) {
      console.log(isFirstCreation ? "Failed while initializing socket:" : "Failed while retrying socket creation:");
      console.log(err);
      isStartingSocket = false;
      if (!isFirstCreation) throw err;
      await attemptSocketCreation(false);
    }
  };

  try {
    await attemptSocketCreation(true);
  } catch {
    console.log("Socket connection failed after retrying with PHP socket");
  }

  if (!ws) {
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
      ws.send(text, waitReply ? resolve : undefined);
      if (!waitReply) {
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
}
