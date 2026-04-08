import { setDebugInfo } from "../../foreground/DebugInfo.js";
import {
  storedPlayerId,
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

async function usePhpSocket(playerId, cookieId, updateUsePhpTime = true) {
  console.log("Switching to PHP socket...");
  ws = null;
  setDebugInfo("Multiplayer", "Disconnected (PHP Socket)");
  if (updateUsePhpTime) {
    localStorage.setItem("use-php-socket-time", new Date().getTime().toString());
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  const obj = {
    type: "php-socket",
    playerId,
    cookieId, 
    send: async (data, callback) => {
      if (typeof data === "object") {
        data = JSON.stringify(data);
      }
      console.log("Sending data through PHP socket:", data);
      const r = await fetch("/3D-Redstone-Simulator/backend-php/api/socket/send.php", {
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
  let [playerId, cookieId] = await Promise.all([
    storedPlayerId(),
    getCookieId(),
  ]);
  if (playerId.split("|").length > 1) {
    debug && console.log("[D]", "Self login code is too long, limiting it");
    playerId = playerId.split("|").slice(0, 1).join("|");
  }
  const lastPhpSocketTime = localStorage.getItem("use-php-socket-time");
  if (lastPhpSocketTime) {
    const lastPhpSocketTimeNum = parseInt(lastPhpSocketTime);
    if (!isNaN(lastPhpSocketTimeNum)) {
      const now = new Date().getTime();
      debug && console.log("[D]", "Last PHP socket time was", now - lastPhpSocketTimeNum, "ms ago");
      if (now - lastPhpSocketTimeNum < 60_000) {
        debug && console.log("[D]", "Last PHP socket time was recent, using PHP socket");
        return await usePhpSocket(playerId, cookieId, false);
      }
    }
  }
  return await new Promise((resolve, reject) => {
    const base = getWebsocketEndpoint();
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
      const lastTime = localStorage.getItem("last-websocket-error-time");
      const lastTimeNum = lastTime ? parseInt(lastTime) : NaN;
      if (isNaN(lastTimeNum) || new Date().getTime() - lastTimeNum > 30_000) {
        console.log("Websocket error occurred over", new Date().getTime() - lastTimeNum, "ms after last error");
        localStorage.setItem("last-websocket-error-time", new Date().getTime().toString());
        location.reload();
        return;
      }
      console.log("Websocket error occurred shortly after last error, not reloading");
      usePhpSocket(playerId, cookieId, true).then((obj) => resolve(obj)).catch((err) => reject(err));
      return;
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
      setDebugInfo("Multiplayer", "Disconnected");
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
  console.log("Initializing multiplier socket...");
  if (isStartingSocket) {
    throw new Error(
      "Cannot initialize socket because it is already being started"
    );
  }
  isStartingSocket = true;

  const attemptSocketCreation = async (retry = false) => {
    try {
      ws = await createSocket();
      console.log(retry ? "Socket retry succeeded" : "Socket initialized successfully");
      isStartingSocket = false;
    } catch (err) {
      console.log(retry ? "Socket retry failed:" : "Failed while starting socket:");
      console.log(err);
      isStartingSocket = false;
      if (!retry) throw err;
    }
  };

  try {
    await attemptSocketCreation();
  } catch {
    console.log("Retrying socket connection once...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    await attemptSocketCreation(true);
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
