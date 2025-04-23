import fs from "fs";
import path from "path";

let target = process.argv[2] || "";

if (
  target.endsWith("backend/index.js") ||
  target.endsWith("backend\\index.js")
) {
  console.log("Target is index.js");
  process.argv[2] = "--host";
  process.argv[3] = "localhost:8070";
  console.log("Updated program arguments to:", process.argv);
}

if (target.endsWith("single.js")) {
  // console.log("Error: Cannot execute self (clearing target)");
  target = "";
}

console.log("Debugging single script:");

if (!target) {
  // console.log("Looking for a target script...");
  const now = new Date().getTime();
  /** @type {(string | {path: string, stat: fs.Stats})[]} */
  const files = [path.resolve(".")];
  /** @type {{path: string, elapsed: number, stat: fs.Stats}[]} */
  const options = [];
  const seen = new Set();
  while (files.length) {
    const f = files.pop();
    const obj =
      typeof f === "object"
        ? f
        : {
            path: f,
            stat: fs.statSync(f),
          };
    if (seen.has(obj.path)) {
      // console.log("Skipped seen:", obj.path);
      continue;
    }
    seen.add(obj.path);
    const name = path.basename(obj.path);
    if (
      name.startsWith(".") ||
      ["node_modules", ".git", "data", "single.js"].includes(name)
    ) {
      // console.log("Skipped blacklist:", obj.path);
      continue;
    }
    if (obj.stat.isFile() && obj.path.endsWith(".js")) {
      options.push({
        path: obj.path,
        elapsed: Math.floor(now - obj.stat.mtimeMs),
        stat: obj.stat,
      });
      continue;
    }
    if (obj.stat.isDirectory()) {
      files.push(
        ...fs.readdirSync(obj.path).map((file) => path.join(obj.path, file))
      );
      continue;
    }
  }
  console.log("Found", options.length, "options", "out of", seen.size, "seen");
  const sorted = options.sort((a, b) => a.elapsed - b.elapsed);
  console.log(
    "Latest updated files:",
    sorted
      .slice(0, 4)
      .map(
        (a) => `${path.basename(a.path)} ${(a.elapsed / 1000).toFixed(1)}s ago`
      )
  );
  if (sorted.length) {
    console.log(
      "Automatically selected recently modified target:",
      path.basename(sorted[0].path)
    );
    target = sorted[0].path;
  }
}

if (!target) {
  console.log("Error: No target script found");
  process.exit(1);
}

if (target.startsWith(process.cwd())) {
  console.log(
    " ",
    `.${target.substring(process.cwd().length)}`.replace(/\\/g, "/")
  );
} else {
  console.log(" ", target.replace(/\\/g, "/"));
}

const result = await import(`file://${target}`);

const name = path.basename(target);

process.stdout.write(`Script "${name}" returned: `);

if (result === undefined) {
  console.log("undefined");
} else if (result === null) {
  console.log("null");
} else if (result && typeof result === "object") {
  for (const [key, value] of Object.entries(result)) {
    console.log(`${typeof value} "${key}"`);
  }
} else {
  console.log(result);
}
