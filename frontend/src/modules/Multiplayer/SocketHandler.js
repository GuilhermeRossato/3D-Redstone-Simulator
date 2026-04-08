import { setDebugInfo } from "../../foreground/DebugInfo.js";
import { set } from "../../world/WorldHandler.js";
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

/** @type {undefined | (WebSocket&{setCookieId?: (cookieId: string) => void, setPlayerId?: (playerId: string) => void})} */
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
    type: "php",
    setCookieId: (newCookieId) => {
      if (cookieId !== newCookieId) {
        console.log("Updated cookieId for PHP socket:", newCookieId);
      }
      cookieId = newCookieId;
    },
    setPlayerId: (newPlayerId) => {
      if (playerId !== newPlayerId) {
        console.log("Updated playerId for PHP socket:", newPlayerId);
      }
      playerId = newPlayerId;
    },
    send: async (data, callback) => {
      if (typeof data === "object") {
        data = JSON.stringify(data);
      }
      console.log("Sending data through PHP socket:", data);
      const full = "/3D-Redstone-Simulator/backend-php/api/socket/send.php";
      const params = [
        [`playerId`, playerId],
        [`cookieId`, cookieId],
      ].filter(param => param[1]).map(param => `${encodeURIComponent(param[0])}=${encodeURIComponent(param[1])}`);
      const extra = params.length ? `?${params.join("&")}` : "";
      const r = await fetch(full+extra, {
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
  obj.send = obj.send.bind(obj);
  return obj;
}

async function createSocket() {
  const lastSocketType = localStorage.getItem("last-successful-socket-type");
  let primarySocket = lastSocketType === "php" ? "php" : "websocket";

  const attemptPhpSocket = async () => {
    try {
      const [playerId, cookieId] = await Promise.all([storedPlayerId(), getCookieId()]);
      const phpSocket = await usePhpSocket(playerId, cookieId, false);
      localStorage.setItem("last-successful-socket-type", "php");
      console.log("PHP socket initialized successfully");
      return phpSocket;
    } catch (err) {
      console.log("PHP socket initialization failed:", err);
      throw err;
    }
  };

  const attemptWebSocket = async () => {
    try {
      const socket = await new Promise((resolve, reject) => {
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
      localStorage.setItem("last-successful-socket-type", "websocket");
      console.log("WebSocket initialized successfully");
      return socket;
    } catch (err) {
      console.log("WebSocket initialization failed:", err);
      throw err;
    }
  };

  try {
    if (primarySocket === "php") {
      return await attemptPhpSocket();
    } else {
      return await attemptWebSocket();
    }
  } catch (err) {
    console.log("Primary socket attempt failed, switching to alternate socket...");
    try {
      if (primarySocket === "php") {
        const socket = await attemptWebSocket();
        location.reload();
        return socket;
      } else {
        const socket = await attemptPhpSocket();
        location.reload();
        return socket;
      }
    } catch (finalErr) {
      console.log("Both socket attempts failed:", finalErr);
      throw finalErr;
    }
  }
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

export function getSocket() {
  if (!ws) {
    throw new Error("Socket has not been initialized");
  }
  return ws;
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
