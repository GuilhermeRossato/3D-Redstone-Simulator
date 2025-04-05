import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import process from "node:process";

import { host, port, url, backendPath } from "./lib/init.js";
import getMimeLookupRecord from "./utils/getMimeLookupRecord.js";
import { once } from "./utils/once.js";

if (!host || !port) {
  console.log(
    "No host or port provided. The url param must be formatted like <host>:[port]"
  );
  process.exit(6);
}

console.log("Starting listening", `http://${url}`, "...");

const mimeLookup = getMimeLookupRecord();

async function handleRequest(req, res) {
  const url = req.url.toLowerCase().startsWith("/3d-redstone-simulator")
    ? req.url.substring("/3d-redstone-simulator".length)
    : req.url;
  if (
    req.method === "GET" &&
    (["/", "/index.html", "/index.php"].includes(url))
  ) {
    return {
      path: "./index.html",
    };
  }
  if (req.method === "GET" && url.startsWith("/favicon.")) {
    return {
      path: "./frontend/favicon.ico",
    };
  }
  if (req.method === "GET" && url.startsWith("/frontend/")) {
    return {
      path: `.${url}`,
    };
  }
  if (req.method === "POST" && url === "/api/logs") {
    const body = [];
    req
      .on("data", (chunk) => {
        body.push(chunk);
      })
      .on("end", () => {
        const buffer = Buffer.concat(body);
        const clientLogFilePath = `${backendPath}/client.log`;
        fs.promises
          .appendFile(clientLogFilePath, buffer)
          .then(() => {
            once(48, () => [
              "[W]",
              "Written",
              buffer.byteLength,
              "bytes of log from client to",
              clientLogFilePath,
            ]);
          })
          .catch((err) => {
            once(50, () => [
              "[W]",
              "Failed writing",
              buffer.byteLength,
              "bytes to",
              clientLogFilePath,
              err.stack,
            ]);
          });
        const text = buffer.toString("utf-8");

        text
          .trim()
          .split("\n")
          .forEach((line) => {
            console.log("[C]", line);
          });
        res.writeHead(200);
        res.end();
      });
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/plain",
  });
  res.end("Hello from the server!");
}

function execSafe(...args) {
  for (const arg of args) {
    try {
      arg();
    } catch (_err) {
      /* ignore */
    }
  }
}

// Generate the Sec-WebSocket-Accept key
function generateAcceptKey(key) {
  const magicString = "258EAFA5-E914-47DA-95CA-C5B5DA8F6B11";
  return crypto
    .createHash("sha1")
    .update(key + magicString)
    .digest("base64");
}

const server = http.createServer((req, res) => {
  handleRequest(req, res)
    .then((data) => {
      if (
        data &&
        typeof data === "object" &&
        Object.keys(data).join(",") === "path" &&
        typeof data.path === "string" &&
        !data.path.includes("/../")
      ) {
        const q = data.path.indexOf("?");
        let target = data.path.substring(0, q === -1 ? data.path.length : q);
        if (!fs.existsSync(target)) {
          console.log(
            req.method,
            req.url,
            "Cannot serve file (not found):",
            target
          );
          return execSafe(
            () => res.writeHead(404, { "Content-Type": "text/plain" }),
            () => res.end("Error: Could not find file")
          );
        }
        if (fs.statSync(target).isDirectory()) {
          target = `${target}/index.html`;
          if (!fs.existsSync(target)) {
            console.log(
              req.method,
              req.url,
              "Cannot serve file (not found):",
              data.path
            );
            return execSafe(
              () => res.writeHead(404, { "Content-Type": "text/plain" }),
              () => res.end("Error: Could not find file")
            );
          }
        }
        fs.promises
          .readFile(target)
          .then((buffer) => {
            const dot = target.lastIndexOf(".");
            const type = mimeLookup[target.substring(dot + 1)] || "text/plain";
            console.log(
              req.method,
              target.substring(target.startsWith(".") ? 1 : 0),
              "(",
              buffer.byteLength,
              "bytes",
              "of",
              type,
              ")"
            );
            return execSafe(
              () =>
                res.writeHead(200, {
                  "Content-Type": type,
                  "Content-Length": buffer.byteLength,
                }),
              () => res.end(buffer)
            );
          })
          .catch((err) => {
            console.log(req.method, req.url, "Failed");
            console.error("Static request handling failed:", err);
            execSafe(
              () => res.writeHead(500, { "Content-Type": "text/plain" }),
              () => res.end(`${err.name}: ${err.message}`)
            );
          });
        return;
      }
      if (data !== undefined) {
        console.log("Handle request response:", data);
        throw new Error(
          `Unexpected handle request response of type "${typeof data}"`
        );
      }
      console.log(req.method, req.url, "Finished");
      console.log("Request handled successfully");
    })
    .catch((err) => {
      console.log(req.method, req.url, "Failed");
      console.error("Request handling failed:", err);
      execSafe(
        () => res.writeHead(500, { "Content-Type": "text/plain" }),
        () => res.end(`${err.name}: ${err.message}`)
      );
    });
});

server.on("upgrade", function (request, socket, head) {
  console.log("Upgrade request received");
  console.log("Upgrade request headers:", request.headers);
  console.log("Upgrade request head:", head);

  socket.on("close", (evt) => {
    console.log(
      `Socket closed for service`,
      evt?.reason,
      evt?.message,
      evt?.cause,
      evt
    );
  });

  socket.on("error", (err) => {
    console.log(`Socket error event:`, err);
  });

  socket.on("end", (evt) => {
    console.log(
      `Socket ended for service`,
      evt?.reason,
      evt?.message,
      evt?.cause,
      evt
    );
  });

  if (request.headers["upgrade"] !== "websocket") {
    console.log("WebSocket connection failed: Upgrade header not present");
    const response = [
      "HTTP/1.1 400 Bad Request",
      "Content-Type: text/plain",
      "Connection: close",
      "",
      "400 Bad Request: Upgrade header not present",
    ].join("\r\n");
    socket.end(response);
    return;
  }

  const accept = request.headers["sec-websocket-key"];
  if (!accept) {
    console.log(
      "WebSocket connection failed: Sec-WebSocket-Key header missing"
    );
    const response = [
      "HTTP/1.1 400 Bad Request",
      "Content-Type: text/plain",
      "Connection: close",
      "",
      "400 Bad Request: Sec-WebSocket-Key header missing",
    ].join("\r\n");
    socket.end(response);
    return;
  }

  let dataCount = 0;
  socket.on("data", (buffer) => {
    console.log("Received websocket data");
    try {
      console.log("WebSocket data received", buffer.length);

      if (dataCount === 0 || dataCount === 1) {
        const masked = (buffer[1] & 0b10000000) >> 7;
        if (masked !== 1) {
          console.log("Warning: Client didn't mask data");
        } else {
          console.log("WebSocket client masked data as expected");
        }
      }
      dataCount += 1;

      // Basic WebSocket frame parsing (text only)
      const FIN = (buffer[0] & 0b10000000) >> 7;
      const Opcode = buffer[0] & 0b00001111;
      const Mask = (buffer[1] & 0b10000000) >> 7;
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

      // Unmask the payload
      for (let i = 0; i < payload.length; i++) {
        payload[i] = payload[i] ^ maskingKey[i % 4];
      }

      const message = payload.toString("utf8");
      console.log(`Received: ${message}`);

      // Echo the message back to the client
      const response = `Server received: ${message}`;
      const responseBuffer = Buffer.from(response, "utf8");
      const responseHeader = Buffer.from([0b10000001, responseBuffer.length]); // FIN + Text Opcode
      socket.write(Buffer.concat([responseHeader, responseBuffer]));
    } catch (err) {
      console.error("Error processing WebSocket data:", err);
      const response = [
        "HTTP/1.1 500 Internal Server Error",
        "Content-Type: text/plain",
        "Connection: close",
        "",
        "500 Internal Server Error: WebSocket data processing failed",
      ].join("\r\n");
      socket.end(response);
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
    console.log("Using the following headers for WebSocket handshake:");
    console.log(responseHeaders);

    socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");

    console.log("WebSocket connection established");
  } catch (err) {
    console.error("Error during WebSocket handshake:", err);
    const response = [
      "HTTP/1.1 500 Internal Server Error",
      "Content-Type: text/plain",
      "Connection: close",
      "",
      "500 Internal Server Error: WebSocket handshake failed",
    ].join("\r\n");
    socket.end(response);
    return;
  }

  socket.on("close", () => {
    console.log("WebSocket connection closed");
  });

  socket.on("error", (error) => {
    console.log("WebSocket error:", error);
    console.error("WebSocket error:", error);
    const response = [
      "HTTP/1.1 500 Internal Server Error",
      "Content-Type: text/plain",
      "Connection: close",
      "",
      "500 Internal Server Error: WebSocket error occurred",
    ].join("\r\n");
    socket.end(response);
  });
});
server.on("error", (err) => {
  console.log("Failed to listen to host", host, "on port", port, "with error:");
  if (err["code"] === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use (host: ${JSON.stringify(host)}).`
    );
    process.exit(2);
  } else {
    console.error(err);
    process.exit(3);
  }
});

server.listen(parseInt(String(port)), host, () => {
  console.log(`Started listening successfully on ${host}:${port}`);
});
