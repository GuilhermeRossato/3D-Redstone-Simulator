import fs from "fs";
import http from "http";
import stream from "stream";
import buffer from "buffer";
import crypto from "node:crypto";
import { index as index2 } from "./packets/index.js";
import getDateTimeString from "../utils/getDateTimeString.js";
import path from "node:path";
import { getProjectFolderPath } from "../utils/getProjectFolderPath.js";

const debug = false;

fs.writeFileSync('packet.log', '', 'utf8');
async function index(input, ctx, count, pings) {
  if (typeof input !== 'object' || input === null) {
    console.log("Invalid input to index:", input);
    process.exit(155);
  }
  const output = await index2(input, ctx, count, pings);
  if (output && !output.type) {
    output.type = input.type;
  }
  const [a, b] = [input, output || {}].map(o => {
    const keys = Object.keys(o || {}).sort().filter(k => !k.startsWith('_') && !['time', 'responseId', 'replyId', 'type'].includes(k));
    keys.unshift('replyId');
    keys.unshift('type');
    return keys.map((k) => `${k}=${JSON.stringify(o[k])}`).join('\t');
  });
  fs.appendFileSync('packet.log', count + ' < ' + a + '\n', 'utf8');
  fs.appendFileSync('packet.log', count + ' > ' + b + '\n', 'utf8');
  return output;
}


// Generate the Sec-WebSocket-Accept key
function generateAcceptKey(key) {
  const magicString = "258EAFA5-E914-47DA-95CA-C5B5DA8F6B11";
  return crypto
    .createHash("sha1")
    .update(key + magicString)
    .digest("base64");
}
const pingFrame = Buffer.from([0b10001001, 0x00]); // FIN + Ping opcode, no payload

let autoloadCount = 0;
let autoloadDelay = 100;
let autoloadTmr;
let contextList = [];
const autoloadData = {};
async function autoloadTick() {

  autoloadCount++;
  const targets = ['frontend/autoload.js'];
  let changed = false;
  for (const target of targets) {
    const stat = await fs.promises.stat(target);
    const mtime = getDateTimeString((Math.floor(stat.mtime.getTime() / 1000)) * 1000);
    const etag = `${target}|${mtime}|${stat.size}`;
    if (!autoloadData[target]) {
      autoloadData[target] = {};
    }
    if (autoloadData[target] && autoloadData[target].etag === etag) {
      autoloadData[target].changed = false;
      continue;
    }
    autoloadData[target].etag = etag;
    autoloadData[target].changed = true;
    autoloadData[target].mtime = mtime;
    autoloadData[target].text = await fs.promises.readFile(target, 'utf-8');
    changed = true;
  }
  const now = Math.floor(new Date().getTime() / 1000);
  if (!autoloadData.time) {
    autoloadData.time = now;
    changed = true;
  }
  if (!changed) {
    return;
  }
  autoloadData.time = now;
  const delta = now - autoloadData.time;
  const all = targets.map(target => [target, autoloadData[target].text, autoloadData[target].changed]);
  const data = Object.fromEntries(all);
  const etag = all.map(a => autoloadData[a[0]].etag).join(',');
  for (const context of contextList) {
    if (!context.autoloadStart) {
      context.autoloadStart = now;
    }
    if (now - context.autoloadStart < 2000) {
      continue;
    }
    if (context.autoloadEtag === etag) {
      continue;
    }
    context.autoloadEtag = etag;
    context.send({
      type: 'autoload',
      prefix: '/3D-Redstone-Simulator/',
      data,
      etag,
    });
  }
  if (autoloadCount > 20) {
    autoloadCount = 0;
    clearInterval(autoloadTmr);
    autoloadTmr = null;
    if (!contextList.length) {
      return;
    }
    if (!autoloadTmr) {
      console.log("Restarting autoload timer");
      autoloadTmr = setInterval(autoloadTick, 500);
    }
  }
}

/**
 * @param {http.IncomingMessage} req
 * @param {stream.Duplex} socket
 * @param {buffer.Buffer} head
 * @param {(err: Error | Event | string | boolean | any[]) => void} error
 * @returns {Promise<void>}
 */
export async function handleRequestUpgrade(req, socket, head, error) {
  if (!autoloadTmr) {
    autoloadTmr = setInterval(autoloadTick, autoloadDelay);
  }
  let watchDog = null;
  debug && console.log("Upgrade request received");
  debug && console.log("Upgrade request headers:", req.headers);
  debug && console.log("Upgrade request head:", head);

  const context = {
    playerId: '',
    entityId: '',
    player: null,
    entity: null,
    send: async () => { console.log("Context send function called, but not implemented") },
  };
  const cleanupContext = () => {
    const keys = ['player', 'entity', 'playerId', 'entityId', 'send'].filter(key => {
      if (!context[key]) {
        return false;
      }
      delete context[key];
      return true;
    });
    debug && keys.length && console.log('Cleaned up context keys:', keys);
    return keys;
  }

  contextList.push(context);

  let processing = 0;
  let packets = 0;
  let pings = 0;

  global.socket = socket;

  let hasProcessedClose = null;

  socket.on("close", (evt) => {
    contextList = contextList.filter(c => c !== context);
    debug && console.log("Socket close event");
    if (hasProcessedClose === false) {
      console.log("[Socket] Sending close packet at 159");
      hasProcessedClose = true;
      const result = index(
        { type: "close", variant: "socket", playerId: context.playerId, entityId: context.entityId },
        context,
        packets,
        pings
      );
      if (result instanceof Promise) {
        result.catch((err) => console.log("Failed to process close event:", err));
      }
      cleanupContext();
    }
    error([
      `Socket closed for service`,
      evt?.reason,
      evt?.message,
      evt?.cause,
      evt,
    ]);
  });

  socket.on("error", (err) => {
    contextList = contextList.filter(c => c !== context);
    if (hasProcessedClose === false) {
      console.log("[Socket] Sending close packet at 184");
      hasProcessedClose = true;
      const result = index(
        { type: "close", variant: "error", error: err, playerId: context.playerId, entityId: context.entityId },
        context,
        packets,
        pings
      );
      if (result instanceof Promise) {
        result.catch((err) => console.log("Failed to process close event:", err));
      }
      cleanupContext();
    }
    debug && console.log("Socket error event:", err);
    error(err);
  });

  socket.on("end", () => {
    debug && console.log("Socket end event");
    contextList = contextList.filter(c => c !== context);
    if (hasProcessedClose === false) {
      console.log("[Socket] Sending close packet at 204");
      hasProcessedClose = true;
      const result = index(
        { type: "close", variant: "end", playerId: context.playerId, entityId: context.entityId },
        context,
        packets,
        pings
      );
      if (result instanceof Promise) {
        result.catch((err) => console.log("Failed to process close event:", err));
      }
      error(`Socket from request ended`);
    }
  });

  if (req.headers["upgrade"] !== "websocket") {
    debug && console.log("Socket invalid header:", req.headers["upgrade"]);
    return error("WebSocket connection failed: Upgrade header invalid");
  }

  const accept = req.headers["sec-websocket-key"];
  if (!accept) {
    debug && console.log("Socket missing accept header:", accept);
    return error(
      "WebSocket connection failed: Sec-WebSocket-Key header missing"
    );
  }

  const watchDogHandler = () => {
    debug && console.log("WebSocket watchDog timeout, checking socket health");
    if (watchDog) {
      clearTimeout(watchDog);
      watchDog = null;
    }
    if (!socket || socket.destroyed) {
      debug && console.log("Socket is destroyed, closing connection");
      socket.end();
      return;
    }
    // Send a ping frame to check socket health
    debug && console.log("Sending WebSocket ping to check health");
    const pingFrame = Buffer.from([0b10001001, 0x00]); // FIN + Ping opcode, no payload
    socket.write(pingFrame);

    watchDog = setTimeout(watchDogHandler, 8000);
    return;
  };

  let lastSendBuffer;
  const sendSocket = (output) => {
    if (watchDog) {
      clearTimeout(watchDog);
      watchDog = null;
    }
    // socket.write(pingFrame);
    watchDog = setTimeout(watchDogHandler, 8000);
    debug && console.log("Sending WebSocket data:", output);
    try {
      if (typeof output === "string") {
        debug && console.log("Socket send invalid output type:", JSON.stringify(typeof output));
        throw new Error(`Invalid output type: ${JSON.stringify(typeof output)}`);
      }
      if (typeof output === "function") {
        debug && console.log("Socket invalid output");
        throw new Error(`Invalid output type: ${typeof output}`);
      }
      if (typeof output.time !== "number" && output.time !== undefined) {
        debug && console.log("Socket send invalid output time:", JSON.stringify(typeof output));
        throw new Error(`Invalid output type: ${JSON.stringify(typeof output)}`);
      }
      debug && console.log("Sending to client:", output);
      if (output && typeof output === "object") {
        debugAddWrite(output, "server");
        const parts = [];
        const list = Object.keys(output).filter(k => !k.startsWith('_') && k !== 'time');
        list.unshift('time');
        for (let i = 0; i < list.length; i++) {
          const key = list[i];
          if (output[key] === undefined) {
            continue;
          }
          try {
            parts.push(`${JSON.stringify(key)}:${JSON.stringify(output[key])}`);
          } catch (err) {
            console.log(
              "Failed to stringify event key:",
              key,
              "of event:",
              output
            );
            console.log("Error:", err);
            try {
              parts.push(
                `${JSON.stringify(`_${key}`)}:${JSON.stringify({
                  error: err.message,
                  stack: err.stack,
                })}`
              );
            } catch (_ignored) {
              // ignore
            }
          }
        }
        output = `{${parts.join(",")}}`;
      }
      const plainText = output && typeof output === "object"
        ? JSON.stringify(output)
        : typeof output === "string"
          ? output
          : String(output);

      const responseBuffer = Buffer.from(
        plainText,
        "utf8"
      );

      const payloadLength = responseBuffer.byteLength;
      if (lastSendBuffer && lastSendBuffer.byteLength === payloadLength) {
        let i;
        for (i = 0; i < lastSendBuffer.byteLength; i++) {
          if (lastSendBuffer[i] !== responseBuffer[i]) {
            break;
          }
        }
        if (i === lastSendBuffer.byteLength) {
          throw new Error(`WebSocket data not changed, not sending: ${JSON.stringify(responseBuffer.toString("utf8"))}`); // Prevent sending identical data
        }
      }
      lastSendBuffer = responseBuffer;
      let header;
      if (payloadLength <= 125) {
        header = Buffer.from([0b10000001, payloadLength]);
      } else if (payloadLength <= 65535) {
        header = Buffer.alloc(4);
        header[0] = 0b10000001;
        header[1] = 126;
        header.writeUInt16BE(payloadLength, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0b10000001;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(payloadLength), 2);
      }

      const buffer = Buffer.concat([header, responseBuffer]);

      //debug && console.log("WebSocket payload has", payloadLength, "bytes and frame has", buffer.byteLength, "bytes");

      //debug && payloadLength < 64 && console.log("WebSocket sending:", buffer);

      // console.log("Sending buffer:", buffer);
      socket.write(buffer);
    } catch (err) {
      console.error("Error sending WebSocket data:", err);
      console.log("Payload:", output);
      return error("WebSocket data send failed");
    }
  };

  // @ts-ignore
  context.send = sendSocket;

  const pending = {
    size: 0,
    received: 0,
    length: 0,
    parts: [],
    mask: Buffer.alloc(4),
  }

  const dataid = "aa"; // Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0').substring(3, 3 + 4);
  const dataWsFolder = getProjectFolderPath("backend", "data", `ws-${dataid}`);
  fs.mkdirSync(dataWsFolder, { recursive: true });

  let lastDebugObject;
  const debugAddWrite = (debugInput, direction) => {
    if (lastDebugObject === debugInput) {
      return
    }
    lastDebugObject = debugInput;
    if (typeof debugInput === 'string') {
      console.log("WebSocket", direction, "data:", debugInput.length);
    } else if (typeof debugInput === 'object') {
      console.log("WebSocket", direction, "object:", debugInput);
    }
    dataWsFolder && fs.appendFileSync(path.join(dataWsFolder, `ws.log`), `${getDateTimeString(Date.now(), NaN, false, true)} ${direction} ${typeof debugInput === 'string' ? debugInput : JSON.stringify(debugInput)}\n`);
  }

  socket.on("data", (buffer) => {
    if (watchDog) {
      clearTimeout(watchDog);
      watchDog = null;
    }
    let input;
    let output;
    let message;
    debug &&
      console.log("Received websocket data with", buffer.byteLength, "bytes");

    try {
      if (pending?.size) {
        const payload = buffer.slice(0, Math.min(buffer.byteLength, pending.size));
        // Unmask the payload
        for (let i = 0; i < payload.byteLength; i++) {
          payload[i] = payload[i] ^ pending.mask[(pending.received + i) % 4];
        }
        pending.received += payload.byteLength;
        pending.parts.push(payload.toString("utf8"));
        pending.size -= payload.byteLength;
        if (pending.size > 0) {
          console.log('Unfinished partial message');
          return;
        }
        // console.log('Finished partial message', pending.parts);
        message = pending.parts.join("");
      } else {
        if (packets === 0 || packets === 1) {
          const masked = (buffer[1] & 0b10000000) >> 7;
          if (masked !== 1) {
            debug && console.log("Warning: Client didn't mask data");
          } else {
            debug && console.log("WebSocket client masked data as expected");
          }
        }

        const opcode = buffer[0] & 0b00001111;

        debug && console.log("Op code:", opcode, `(${opcode.toString(16)})`);

        if (opcode === 0x9) {
          // Ping frame received, respond with Pong
          pings++;
          debug && console.log("Ping frame received, sending Pong");
          const pongFrame = Buffer.from([0b10001010, 0x00]); // FIN + Pong opcode, no payload
          socket.write(pongFrame);
          return;
        }
        if (opcode === 0x8) {
          // Close frame received
          console.log("Close frame received, closing connection");
          socket.end();
          input = { type: "close", playerId: context.playerId, entityId: context.entityId };
        } else {
          packets++;

          // Basic WebSocket frame parsing (text only)
          const fin = (buffer[0] & 0b10000000) >> 7;
          let payloadLength = buffer[1] & 0b01111111;

          let maskingKeyStart = 2;
          if (payloadLength === 126) {
            payloadLength = buffer.readUInt16BE(2);
            maskingKeyStart = 4;
          } else if (payloadLength === 127) {
            console.log("Payload too long (might fail to connect)");
            payloadLength = buffer.readBigUInt64BE(2);
            maskingKeyStart = 10;
          }
          const maskingKey = buffer.slice(maskingKeyStart, maskingKeyStart + 4);
          const payloadStart = maskingKeyStart + 4;
          const payload = buffer.slice(
            payloadStart,
            payloadStart + Number(payloadLength)
          );
          if (pending.size <= 0) {
            const missing = payloadLength - payload.byteLength;
            if (missing > 0) {
              pending.size = missing;
              // console.log("Payload too long:",pending.size," bytes pending (partial request)");
            }
          }
          // Unmask the payload
          for (let i = 0; i < payload.length; i++) {
            payload[i] = payload[i] ^ maskingKey[i % 4];
          }
          message = payload.toString("utf8");
          if (pending.size) {
            pending.mask[0] = maskingKey[0];
            pending.mask[1] = maskingKey[1];
            pending.mask[2] = maskingKey[2];
            pending.mask[3] = maskingKey[3];
            pending.received = payload.length;
            pending.length = payloadLength;
            pending.parts = [message];
            pending.size = pending.length - pending.received;
            return;
          }
        }
      }
      if (!input && message) {
        const jsonType = { "{}": "object", "[]": "array", '""': "string" }[
          message[0] + message[message.length - 1]
        ];
        if (jsonType) {
          try {
            input = JSON.parse(message);
            debug && console.log("Parsed JSON:", input);
            if (
              !input.type &&
              typeof input?.t === "string" &&
              input?.t[0] !== "2"
            ) {
              input.type = input.t;
              delete input.t;
            }
          } catch (err) {
            console.error("Failed to parse JSON:", err);
            output = { type: "error", message: "Invalid JSON format" };
          }
        } else {
          input = message.trim().substring(0, 16).includes("Error")
            ? { type: "error", message }
            : { type: "string", text: message };
        }
        if (!input.type || input.type === 'string') {
          if (input?.type === 'string' && input?.text?.includes('AAAAAA')) {
            console.log("Ignoring special string packet:", input);
            return;
          }
          console.error("Ignoring invalid packet type:", input);
          output = {
            type: "error",
            message: "Invalid packet type",
            responseId: input?.replyId,
          };
        }
      }
      if (!message && !input) {
        debug && console.log("No message or input received");
        return;
      }
      if (output) {
        debug && console.log("Skipping processing due to prior error");
      } else {
        processing++;
        try {
          debug && console.log("Processing packet:", input);
          if (input?.type === "setup" && hasProcessedClose === null) {
            hasProcessedClose = false;
          }
          output = index(input, context, packets, pings);
          if (input?.type === "close" && hasProcessedClose === false) {
            hasProcessedClose = true;
            contextList = contextList.filter(c => c !== context);
            cleanupContext();
          }
          if (input.type === 'setup' && context?.player?.id) {
            context.playerId = context.player.id;
            // @ts-ignore
            context.send = sendSocket;
          }
        } catch (err) {
          console.log("Request handler error:", err);
          console.log("        input:", input);
          console.log("        context:", context);
          output = {
            type: "error",
            message: err.message,
            stack: err.stack,
            cause: err.cause,
            code: err.code,
          };
        }
      }
      if (output && output instanceof Promise) {
        output
          .then((result) => {
            if (input.type === 'setup' && context?.player?.id && context.playerId !== context?.player?.id) {
              context.playerId = context.player.id;
              // @ts-ignore
              context.send = sendSocket;
            }
            processing--;
            output = result;
            if (
              output &&
              typeof output === "object" &&
              typeof input?.replyId === 'number' &&
              output.responseId === undefined
            ) {
              output.responseId = input.replyId;
            }
            if (output === undefined && !input.replyId) {
              return;
            }
            return sendSocket(output);
          }).catch((err) => {
            console.error("Failed processing packet of type", input?.type, "with error:", err);
            console.log("        input:", input);
            processing--;
            output = {
              type: "error",
              message: err.message,
              stack: err.stack,
              cause: err.cause,
              code: err.code,
              responseId: input?.replyId,
            };
            return sendSocket(output);
          });
        return;
      }
      processing--;
      if (
        output &&
        typeof output === "object" &&
        input?.replyId &&
        !output.responseId
      ) {
        output.responseId = input.replyId;
      }
      if (output === undefined && !input.replyId) {
        return;
      }
      return sendSocket(output);
    } catch (err) {
      console.error("Error processing WebSocket data:", err);
      return error("WebSocket data processing failed");
    }
  });

  try {
    const acceptKey = generateAcceptKey(accept);
    const responseHeaders = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
    ];
    // console.log("Using the following headers for WebSocket handshake:", responseHeaders);

    socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");

    debug && console.log("WebSocket switching protocol header sent");
  } catch (err) {
    console.error("Error during WebSocket handshake:", err);
    return error("WebSocket handshake failed");
  }
}
