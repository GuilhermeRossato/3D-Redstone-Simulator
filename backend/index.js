import fs from "node:fs";
import http from "node:http";
import process from "node:process";
import child_process from "node:child_process";

const detached = extractArgs([
  "--detach",
  "--detached",
  "--daemon",
  "--async",
  "--background",
  "--bg",
  "-bg",
]).length;

if (detached) {
  console.log("Spawning detached process");
  console.log(" > node", ...process.argv.slice(1));
  const c = child_process.spawn(process.argv[0], process.argv.slice(1), {
    stdio: "ignore",
    detached: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 150));
  console.log(
    "Detached process",
    c?.pid ? "spawned" : "failed to spawn",
    c?.pid === undefined ? "" : c.pid
  );
  c?.unref?.();
  await new Promise((resolve) => setTimeout(resolve, 150));
  process.exit(0);
}

import { host, port, url, backendPath } from "./lib/init.js";
import getMimeLookupRecord from "./utils/getMimeLookupRecord.js";
import { once } from "./utils/once.js";
import { extractArgs } from "./utils/extractArgs.js";
import { handleRequestUpgrade } from "./multiplayer/handleRequestUpgrade.js";

if (!host || !port) {
  console.log(
    "No host or port provided. The url param must be formatted like <host>:[port]"
  );
  process.exit(6);
}

console.log("Process", process.pid, "will listen to:", `http://${url}`, "...");

const mimeLookup = getMimeLookupRecord();

async function handleRequest(req, res) {
  const url = req.url.toLowerCase().startsWith("/3d-redstone-simulator")
    ? req.url.substring("/3d-redstone-simulator".length) || "/"
    : req.url;
  if (
    req.method === "GET" &&
    ["/", "/index.html", "/index.php"].includes(url)
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
            // console.log(
            //   req.method,
            //   target.substring(target.startsWith(".") ? 1 : 0),
            //   "(",
            //   buffer.byteLength,
            //   "bytes",
            //   "of",
            //   type,
            //   ")"
            // );
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
  /** @type {Parameters<typeof handleRequestUpgrade>[3]} */
  const onError = (err) => {
    if (!err) {
      console.log("Empty error argument on upgrade request error handler");
      return;
    }
    const arr = err instanceof Array ? err : [err];
    if (
      (arr.length === 1||arr.length === 5) &&
      (arr[0] === "Socket closed for service" ||
        arr[0] === "Socket ended for service")
    ) {
      console.log("Socket ended for service");
      return;
    }
    if (
      (arr.length === 1||arr.length === 5) &&
      arr[0] instanceof Error &&
      arr[0].message === 'write after end'
    ) {
      console.log('Socket ended on write');
      return;
    }
    console.log("Received error on upgrade request error handler:", ...arr);
    try {
      const response = [
        "HTTP/1.1 400 Bad Request",
        "Content-Type: text/plain",
        "Connection: close",
        "",
        `400 Bad Request: ${arr
          .map((err) =>
            err instanceof Array
              ? JSON.stringify(err.map((v, i) => ({ i, v })))
              : err instanceof Error
              ? err.stack
              : err instanceof Event
              ? `Error event of type ${err.type}`
              : typeof err === "string"
              ? `Error message: ${err.length === 0 ? "empty" : err}`
              : JSON.stringify(err)
          )
          .join(" ")}`,
      ].join("\r\n");
      socket.end(response);
    } catch (err) {
      console.error("Error sending upgrade error response:", err);
    }
  };
  handleRequestUpgrade(request, socket, head, onError)
    .then(() => {
      console.log("Upgrade request handled");
    })
    .catch((err) => {
      console.log("Error in upgrade handler:", err);
      try {
        const response = [
          "HTTP/1.1 500 Internal Server Error",
          "Content-Type: text/plain",
          "Connection: close",
          "",
          "500 Internal Server Error: Upgrade handler error:",
          "",
          err.stack,
        ].join("\r\n");
        socket.end(response);
      } catch (err) {
        console.error("Error sending upgrade response:", err);
      }
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
