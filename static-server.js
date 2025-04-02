// This is a static http server script

import { fileURLToPath } from "url";
import path from "path";
import http from "http";
import fs from "fs";
import crypto from "crypto";

/**
 * @param {string} parameter
 * @param {string} fallback
 */
function getArgumentOrDefault(parameter, fallback) {
  const before = process.argv
    .slice(2)
    .map((arg, index) => ({ arg, index }))
    .filter(({ arg }) => arg === parameter)
    .pop();
  return before ? process.argv[2 + before.index + 1] || fallback : fallback;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = {
  host: getArgumentOrDefault("--host", "localhost"),
  port: getArgumentOrDefault("--port", "8080"),
  path: getArgumentOrDefault("--path", __dirname),
};
const mimeLookup = {
  aac: "audio/aac",
  abw: "application/x-abiword",
  arc: "application/x-freearc",
  avi: "video/x-msvideo",
  azw: "application/vnd.amazon.ebook",
  bin: "application/octet-stream",
  bmp: "image/bmp",
  bz: "application/x-bzip",
  bz2: "application/x-bzip2",
  csh: "application/x-csh",
  css: "text/css",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gz: "application/gzip",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/vnd.microsoft.icon",
  ics: "text/calendar",
  jar: "application/java-archive",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  jsonld: "application/ld+json",
  mid: "audio/midi",
  midi: "audio/midi",
  mjs: "text/javascript",
  mp3: "audio/mpeg",
  mpeg: "video/mpeg",
  mpkg: "application/vnd.apple.installer+xml",
  odp: "application/vnd.oasis.opendocument.presentation",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odt: "application/vnd.oasis.opendocument.text",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  opus: "audio/opus",
  otf: "font/otf",
  png: "image/png",
  pdf: "application/pdf",
  php: "application/x-httpd-php",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  rar: "application/vnd.rar",
  rtf: "application/rtf",
  sh: "application/x-sh",
  svg: "image/svg+xml",
  swf: "application/x-shockwave-flash",
  tar: "application/x-tar",
  tif: "image/tiff",
  tiff: "image/tiff",
  ts: "video/mp2t",
  ttf: "font/ttf",
  txt: "text/plain",
  vsd: "application/vnd.visio",
  wav: "audio/wav",
  weba: "audio/webm",
  webm: "video/webm",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xml: "application/xml ",
  xul: "application/vnd.mozilla.xul+xml",
  zip: "application/zip",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  "7z": "application/x-7z-compressed",
};

function generateAcceptKey(key) {
  const magicString = "258EAFA5-E914-47DA-95CA-C5B5DA8F6B11";
  const sha1 = crypto.createHash("sha1");
  sha1.update(key + magicString);
  return sha1.digest("base64");
}

const server = http.createServer();

server.on("request", async function (req, res) {
  let filename;
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const uri = url.pathname;
    if (uri.includes("..")) {
      console.log(
        `[${new Date().toISOString()}] 404 ${uri} (unsafe request blocked)`
      );
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.write("404 Not Found\n");
      res.end();
      return;
    }
    filename = path.join(config.path, decodeURIComponent(uri));
    const stats = await fs.promises.stat(filename);

    if (stats.isDirectory()) {
      filename += "/index.html";
    }

    let file;
    try {
      file = await fs.promises.readFile(filename, "binary");
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log(
          `[${new Date().toISOString()}] 404 ${uri} Not found: "${path.resolve(
            filename
          )}"`
        );
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.write("404 Not Found\n");
      } else {
        console.log(
          `[${new Date().toISOString()}] 500 ${uri} ${err.toString()}`
        );
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.write(err + "\n");
      }
      res.end();
      return;
    }

    const type = mimeLookup[filename.substring(filename.lastIndexOf(".") + 1)];
    res.writeHead(200, { "Content-Type": type || "text/plain" });
    res.write(file, "binary");
    res.end();
    console.log(`[${new Date().toISOString()}] 200 ${uri}`);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(
        `[${new Date().toISOString()}] 404 ${
          req.url
        } Not found: "${path.resolve(filename)}"`
      );
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.write("404 Not Found\n");
    } else {
      console.log(
        `[${new Date().toISOString()}] 500 ${req.url} ${err.toString()}`
      );
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.write(err + "\n");
    }
    res.end();
  }
});

server.on("upgrade", function (request, socket, head) {
  console.log("Upgrade request received");
  console.log("Upgrade request headers:", request.headers);
  console.log("Upgrade request head:", head);
  if (request.headers["upgrade"] !== "websocket") {
    console.log("WebSocket connection failed: Upgrade header not present");
    socket.destroy();
    return;
  }

  request.socket.on('end', () => {
    console.log(`req.socket ended`);
    if (!socket.closed) {
      console.log(`socket closed`);
      socket.end();
    }
  });
  request.socket.on('close', () => {
    console.log(`req.socket closed for service`);
  });
  
  socket.on('close', () => {
    console.log(`socket closed for service`);
  });
  
  socket.on('end', () => {
    console.log(`socket endd for service`);
  });


  const accept = request.headers["sec-websocket-key"];

  try {
    const acceptKey = generateAcceptKey(accept);
    const responseHeaders = [
      "HTTP/1.1 101 Web Socket Protocol Handshake",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
    ];
    console.log("Using the following header:");
    console.log(responseHeaders);

    socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");

    console.log("WebSocket connection established");
  } catch (err) {
    console.error("Error during WebSocket handshake:", err);
    socket.destroy();
    return;
  }

  let dataCount = 0;
  socket.on("data", (buffer) => {
    try {
      console.log("WebSocket data received", buffer.length);

      if (dataCount === 0 || dataCount === 1) {
        const masked = (buffer[1] & 0b10000000) >> 7;
        if (masked !== 1) {
          console.log("Warning: Client didn't mask data");
        } else {
          console.log("WebSocket client masked data expectedly");
        }
      }
      dataCount = dataCount + 1;
      //Basic websocket frame parsing (text only)
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

      //Unmask the payload
      for (let i = 0; i < payload.length; i++) {
        payload[i] = payload[i] ^ maskingKey[i % 4];
      }

      const message = payload.toString("utf8");
      console.log(`Received: ${message}`);

      // Echo the message back to the client
      const response = `Server received: ${message}`;
      const responseBuffer = Buffer.from(response, "utf8");
      const responseHeader = Buffer.from([0b10000001, responseBuffer.length]); //FIN + Text Opcode
      socket.write(Buffer.concat([responseHeader, responseBuffer]));
    } catch (err) {
      console.error("Error processing WebSocket data:", err);
      socket.destroy();
    }
  });

  socket.on("close", () => {
    console.log("WebSocket connection closed");
  });

  socket.on("error", (error) => {
    console.log("WebSocket error:", error);
    console.error("WebSocket error:", error);
    socket.destroy();
  });
});

server.listen(parseInt(config.port.toString(), 10), config.host, () =>
  console.log(
    `[${new Date().toISOString()}] Listening at 'http://${config.host}${
      config.port.toString() !== "80" ? ":" + config.port : ""
    }/' and serving '${path.resolve(config.path)}'`
  )
);
