import http from "http";
import crypto from "crypto";

const server = http.createServer((req, res) => {
  // Handle regular HTTP requests here (if needed)
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from the HTTP server!");
});

server.on("upgrade", (req, socket, head) => {
  console.log("Upgrade request received");
  console.log("Upgrade request headers:", req.headers);

  if (req.headers["upgrade"] !== "websocket") {
    console.log("WebSocket connection failed: Upgrade header not present");
    socket.destroy();
    return;
  }

  const acceptKey = req.headers["sec-websocket-key"];
  if (!acceptKey) {
    console.log(
      "WebSocket connection failed: Sec-WebSocket-Key header missing"
    );
    socket.destroy();
    return;
  }

  // Generate the Sec-WebSocket-Accept header value
  const magicString = "258EAFA5-E914-47DA-95CA-C5B5DA8F6B11";
  const sha1 = crypto.createHash("sha1");
  sha1.update(acceptKey + magicString);
  const acceptValue = sha1.digest("base64");

  const responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptValue}`,
  ];

  socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");

  console.log("WebSocket connection established");

  socket.on("data", (buffer) => {
    // Basic WebSocket frame parsing (text only)
    const FIN = (buffer[0] & 0b10000000) >> 7;
    const Opcode = buffer[0] & 0b00001111;
    const Mask = (buffer[1] & 0b10000000) >> 7;
    let PayloadLength = buffer[1] & 0b01111111;

    let maskingKeyStart = 2;
    if (PayloadLength === 126) {
      PayloadLength = buffer.readUInt16BE(2);
      maskingKeyStart = 4;
    } else if (PayloadLength === 127) {
      PayloadLength = buffer.readBigUInt64BE(2);
      maskingKeyStart = 10;
    }

    const maskingKey = buffer.slice(maskingKeyStart, maskingKeyStart + 4);
    const payloadStart = maskingKeyStart + 4;

    const payload = buffer.slice(
      payloadStart,
      payloadStart + Number(PayloadLength)
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
  });

  socket.on("close", () => {
    console.log("WebSocket connection closed");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

const port = 8080;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
