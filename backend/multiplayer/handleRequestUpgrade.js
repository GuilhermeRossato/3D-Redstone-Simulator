import http from "http";
import stream from "stream";
import buffer from "buffer";
import crypto from "node:crypto";
import { index } from "./packets/index.js";

const debug = false;

// Generate the Sec-WebSocket-Accept key
function generateAcceptKey(key) {
  const magicString = "258EAFA5-E914-47DA-95CA-C5B5DA8F6B11";
  return crypto
    .createHash("sha1")
    .update(key + magicString)
    .digest("base64");
}



/**
 * @param {http.IncomingMessage} req
 * @param {stream.Duplex} socket
 * @param {buffer.Buffer} head
 * @param {(err: Error | Event | string | boolean | any[]) => void} error
 * @returns {Promise<void>}
 */
export async function handleRequestUpgrade(req, socket, head, error) {
  debug && console.log("Upgrade request received");
  debug && console.log("Upgrade request headers:", req.headers);
  debug && console.log("Upgrade request head:", head);

  const context = {};
  let processing = 0;
  let packets = 0;
  let pings = 0;
  let playerId = '';

  global.socket = socket;

  let hasProcessedClose = null;

  socket.on("close", (evt) => {
    debug && console.log("Socket close event");
    if (playerId) {
      
      playerId = '';
    }
    if (hasProcessedClose === false) {
      hasProcessedClose = true;
      index(
        { type: "close", variant: "socket" },
        context,
        packets,
        pings
      ).catch((err) => console.log("Failed to process close event:", err));
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
    if (playerId) {
      
      playerId = '';
    }
    if (hasProcessedClose === false) {
      hasProcessedClose = true;
      index(
        { type: "close", variant: "error", error: err },
        context,
        packets,
        pings
      ).catch((err) => console.log("Failed to process close event:", err));
    }
    debug && console.log("Socket error event");
    error(err);
  });

  socket.on("end", () => {
    if (playerId) {
      
      playerId = '';
    }
    if (hasProcessedClose === false) {
      hasProcessedClose = true;
      index({ type: "close", variant: "end" }, context, packets, pings).catch(
        (err) => console.log("Failed to process close event:", err)
      );
    }
    debug && console.log("Socket end event");
    error([`Socket ended for service`]);
  });

  if (req.headers["upgrade"] !== "websocket") {
    debug && console.log("Socket invalid header");
    return error("WebSocket connection failed: Upgrade header not present");
  }

  const accept = req.headers["sec-websocket-key"];
  if (!accept) {
    debug && console.log("Socket invalid accept");
    return error(
      "WebSocket connection failed: Sec-WebSocket-Key header missing"
    );
  }
  const sendSocket = (output) => {
    try {
      if (typeof output === "function") {
        debug && console.log("Socket invalid output");
        throw new Error(`Invalid output type: ${typeof output}`);
      }
      debug && console.log("Sending to client:", output);

      if (output && typeof output === "object") {
        const parts = [];
        const list = Object.keys(output);
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
            parts.push(
              `${JSON.stringify(key)}:${JSON.stringify({
                error: err.message,
                stack: err.stack,
              })}`
            );
          }
        }
        output = `{${parts.join(",")}}`;
      }
      const responseBuffer = Buffer.from(
        output && typeof output === "object"
          ? JSON.stringify(output)
          : typeof output === "string"
          ? output
          : String(output),
        "utf8"
      );

      let payloadLength = responseBuffer.byteLength;
      let payloadLengthBytes;

      if (payloadLength <= 125) {
        debug && console.log("Payload length is small");
        payloadLengthBytes = Buffer.from([payloadLength]);
      } else if (payloadLength <= 65535) {
        debug && console.log("Payload length is medium");
        payloadLengthBytes = Buffer.alloc(3);
        payloadLengthBytes.writeUInt16BE(payloadLength, 1);
        payloadLengthBytes[0] = 126;
      } else {
        debug && console.log("Payload length is large");
        payloadLengthBytes = Buffer.alloc(9);
        payloadLengthBytes.writeBigUInt64BE(BigInt(payloadLength), 1);
        payloadLengthBytes[0] = 127;
      }

      const responseHeader = Buffer.concat([
        Buffer.from([0b10000001]),
        payloadLengthBytes,
      ]);

      debug && console.log("WebSocket response size:", payloadLength);

      const buffer = Buffer.concat([responseHeader, responseBuffer]);
      // console.log("Sending buffer:", buffer);
      socket.write(buffer);
    } catch (err) {
      console.error("Error sending WebSocket data:", err);
      console.log("Payload:", output);
      return error("WebSocket data send failed");
    }
  };

  const pending = {
    size: 0,
    received: 0,
    length: 0,
    parts: [],
    mask: Buffer.alloc(4),
  }

  socket.on("data", (buffer) => {
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
        if (playerId) {
          
          playerId = '';
        }
        // Close frame received
        console.log("Close frame received, closing connection");
        socket.end();
        input = { type: "close" };
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
        if (pending.size<=0) {
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
    if (!input&&message) {
        const jsonType = { "{}": "object", "[]": "array", '""': "object" }[
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
        if (!input.type||input.type==='string') {
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
      if (!message&&!input) {
        debug && console.log("No message or input received");
        return;
      }
      if (!output) {
        processing++;
        try {
          debug && console.log("Processing packet:", input);
          if (input?.type === "setup" && hasProcessedClose === null) {
            hasProcessedClose = false;
          } else if (input?.type === "close" && hasProcessedClose === false) {
            hasProcessedClose = true;
          }
          output = index(input, context, packets, pings);
          if (input.type === 'setup' && context?.player?.id) {
            playerId = context.player.id;
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
          if (input.type === 'setup' && context?.player?.id) {
            playerId = context.player.id;
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
            console.error("Error in packet processing promise:", err);
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
