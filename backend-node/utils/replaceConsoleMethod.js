import fs from "fs";
import { getCurrentStackList } from "./getCurrentStackList.js";

const resetOutput = true;
const removeColor = true;

/** @type {Record<string, any>} */
const methodsRecord = {};

/** @type {Record<string, any>} */
const outputRecord = {};

/** @type {Record<string, Record<string, number>>} */
const countRecord = {};

const write0 = process.stdout.write;
const write1 = process.stderr.write;

let s;
let f;
let writeArray;

function augmentProcessWrite(outputFilePath, ...args) {
  let text =
    typeof args[0] === "string"
      ? args[0]
      : args[0] instanceof Buffer
      ? args[0].toString("utf-8")
      : "?";
  if (writeArray instanceof Array) {
    writeArray.push(text);
  }
  if (outputFilePath) {
    const list =
      outputFilePath instanceof Array
        ? outputFilePath
        : outputFilePath.split(",");
    for (const outputFilePath of list) {
      if (outputFilePath.endsWith(".json")) {
        continue;
      }
      if (["source", "src", "self"].includes(outputFilePath)) {
        if (s.endsWith("index.js")) {
        }
        continue;
      }
      if (!outputRecord[outputFilePath]) {
        outputRecord[outputFilePath] = true;
        if (resetOutput) {
          fs.writeFileSync(outputFilePath, "", "utf-8");
        }
      }
      const save = removeColor ? text.replace(/\x1B\[\d+m/g, "") : text;
      fs.appendFileSync(
        outputFilePath,
        outputFilePath.endsWith(".json") || outputFilePath.endsWith(".jsonl")
          ? `${JSON.stringify(save)},\n`
          : save,
        "utf-8"
      );
    }
  }
  text = text
    .split("\n")
    .map((line, i, arr) =>
      i === 0 || i + 1 === arr.length ? line : f + "+" + line
    )
    .join("\n");
  write0.call(process.stdout, text);
}

function augmentConsoleArgumentList(method, relativePath, args, stackList) {
  const now = new Date().getTime();
  let aux;
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] === "number" && Math.floor(args[i]) !== args[i]) {
      args[i] = parseFloat(args[i].toFixed(args[i] < 60 ? 2 : 1));
    } else if (
      typeof args[i] === "object" &&
      args[i] instanceof Date &&
      !isNaN((aux = args[i].getTime()))
    ) {
      const dateStr = new Date(args[i].getTime() - 3 * 60 * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .replace("Z", "")
        .substring(0, 19);
      const parts = [
        dateStr.endsWith(".000") ? dateStr.substring(0, 19) : dateStr,
      ];
      const d = Math.abs(now - aux);
      if (!(d < 10 || d > 24 * 60 * 60 * 1_000)) {
        const [n, m, u] =
          d <= 6_000
            ? [d < 1000 ? 2 : 1, 1_000, "s"]
            : d <= 60 * 60 * 1_000
            ? [1, 60 * 1_000, "m"]
            : [1, 60 * 60 * 1_000, "h"];
        const t = `${(d / m).toFixed(d % m === 0 ? 0 : n)} ${u}`;
        parts.push(now < aux ? `(in ${t})` : `(${t} ago)`);
      }
      args[i] = parts.join(" ");
      continue;
    }
  }
  s = stackList[0].path;
  let p = stackList[0].path.replace(/\\/g, "/");
  if (p.replace(/\\/g, "/").startsWith(relativePath)) {
    p = `./${p.substring(relativePath.length + 1)}`;
  }
  p += `:${stackList[0].line}`;
  args.unshift(p);
  if (method === "debug") {
    args.unshift("[D]");
  } else if (method === "info") {
    args.unshift("[I]");
  } else if (method === "warn") {
    args.unshift("[W]");
  }
  return args;
}

export function replaceConsoleMethod(
  method = "log",
  outputFileList = ["", [""]][0]
) {
  if (methodsRecord[method]) {
    return "already-replaced";
  }
  const cl = (methodsRecord[method] = console[method]);

  countRecord[method] = {};

  const cwd =
    typeof process === "object" ? process.cwd().replace(/\\/g, "/") : "";

  const outputFiles =
    outputFileList instanceof Array
      ? outputFileList
      : outputFileList.split(",");

  const srcOutputList = outputFiles.filter((a) =>
    ["source", "src", "self"].includes(a)
  );
  const jsonOutputList = outputFiles.filter(
    (a) => !srcOutputList.includes(a) && a.endsWith(".json")
  );
  const normalOutputList = outputFiles.filter(
    (a) => !srcOutputList.includes(a) && !jsonOutputList.includes(a)
  );

  const writer = augmentProcessWrite.bind(cl, normalOutputList);
  const augment = augmentConsoleArgumentList.bind(cl, method, cwd);

  // @ts-ignore
  console[method] = function wrappedConsoleMethod(...args) {
    try {
      if (args.length === 1 && typeof args[0] === "function") {
        const result = args[0]();
        if (result instanceof Promise) {
          result
            .then((res) => {
              wrappedConsoleMethod(res);
            })
            .catch((err) => {
              cl.call(console, "\nFailed at console method:", err, "\n");
            });
          return;
        }
        if (
          result instanceof Array &&
          !(result.length === 1 && typeof result[0] === "function")
        ) {
          return wrappedConsoleMethod(...result);
        }
        if (typeof result !== "function") {
          return wrappedConsoleMethod(result);
        }
        cl.call(
          console,
          `[replaceConsoleMethod] Error: Invalid result from method argument`,
          {
            args,
            result,
          }
        );
        throw new Error("Invalid result from method argument");
      }

      const parsed = getCurrentStackList(new Error("a"));

      if (!parsed) {
        cl.call(
          console,
          `[replaceConsoleMethod] Error: 'parsed' is undefined`,
          {
            parsed,
            args,
          }
        );
        throw new Error("Parsed data is missing");
      }

      if (!parsed.stack[0]) {
        cl.call(
          console,
          `[replaceConsoleMethod] Error: No data found in 'parsed'`,
          {
            parsed,
            args,
          }
        );
        throw new Error("Missing first element in parsed data");
      }

      if (!parsed.stack[0].path) {
        cl.call(
          console,
          `[replaceConsoleMethod] Error: First stack trace's 'path' is undefined`,
          {
            parsed,
            args,
          }
        );
        throw new Error("Source information is missing");
      }
      parsed.stack = parsed.stack.filter(
        (item, index) => index !== 0 && item.type !== "node:internal"
      );
      const firstStack = parsed.stack[0];
      if (!augment(args, parsed.stack)) {
        return;
      }
      const c = countRecord[method][args[0]] || 0;
      countRecord[method][args[0]] = c + 1;

      for (const outputFilePath of jsonOutputList) {
        try {
          if (!outputRecord[outputFilePath]) {
            outputRecord[outputFilePath] = true;
            if (resetOutput) {
              fs.writeFileSync(outputFilePath, "", "utf-8");
            }
          }
          const parts = [`"${args[0]}`];
          if (c > 0) {
            parts.push(`#${c}`);
          }
          parts.push(`": [`);
          for (let i = 1; i < args.length; i++) {
            try {
              const arg = args[i];
              parts.push(
                JSON.stringify(arg instanceof Error ? arg.stack : arg)
              );
            } catch (err) {
              parts.push('"Error: Failed to stringify argument"');
            }
            if (i < args.length - 1) {
              parts.push(", ");
            }
          }
          fs.appendFileSync(outputFilePath, `${parts.join("")}],\n`, "utf-8");
        } catch (err) {
          cl.call(console, "\nFailed at logging:", err, "\n");
        }
      }
      f = args[0];
      try {
        if (srcOutputList.length) {
          writeArray = [];
        }
        process.stdout.write = writer;
        process.stderr.write = writer;
        cl.call(console, ...args);
        process.stdout.write = write0;
        process.stderr.write = write1;
        if (
          writeArray instanceof Array &&
          writeArray?.[0]?.startsWith(f) &&
          fs.existsSync(firstStack.path) &&
          firstStack.path.endsWith(".js") &&
          writeArray.length
        ) {
          const raw = fs.readFileSync(firstStack.path, "utf-8");
          const lines = raw.split("\n");
          const line = lines[firstStack.line - 1];
          const start = line.substring(0, firstStack.col - 1);
          const slice = line.substring(firstStack.col - 1);
          if (start.includes("console") && slice.startsWith(`${method}(`)) {
            updateSourceFile(
              firstStack.path,
              raw,
              lines.slice(0, firstStack.line - 1).join("\n").length +
                firstStack.col +
                method.length,
              parsed.stack,
              args.slice(1),
              writeArray.join("")
            );
            
          }
        }
      } catch (err) {
        process.stdout.write = write0;
        process.stderr.write = write1;
        throw err;
      }
    } catch (err) {
      cl.call(console, "\nFailed at logging:", err, "\n");
    }
  };
}

function updateSourceFile(
  filePath,
  fileText,
  startIndex,
  stack,
  args,
  text
) {
  const b = fileText.indexOf(")", startIndex + 1);
  if (b === -1) {
    return;
  }
  let left = fileText.substring(0, startIndex + 1);
  let subject = fileText.substring(startIndex + 1, b);
  let right = fileText.substring(b);

  const skipPrefix =
    typeof args[0] === "string" &&
    args[0].length &&
    (subject.startsWith('"' + args[0] + subject[0]) ||
      subject.startsWith("'" + args[0] + subject[0]) ||
      subject.startsWith("`" + args[0] + subject[0]));
  const filtered = skipPrefix ? args.slice(1) : args;
  const txt = JSON.stringify(
    filtered.length === 1 ? filtered[0] : filtered
  );

  if (right.startsWith(");\n")) {
    left = left + subject + "); //";
    right = right.substring(right.indexOf(";") + 1);
  } else if (right.startsWith("); //")) {
    left = left + subject + "); //";
    right = right.substring(right.indexOf("\n"));
  } else if (right.startsWith("); /*")) {
    left = left + subject + "); /*";
    right = right.substring(right.indexOf("*/") + 2);
  } else if (right.split(" ").join("").startsWith(");\n/*")) {
    left = left + subject + "); /*";
    right = right.substring(right.indexOf("*/") + 2);
  } else {
    return;
  }
  if (left.endsWith("//")) {
    left = left + " " + txt;
  } else if (left.endsWith("/*")) {
    left = left + " " + txt + " */";
  }
  const updated = left + right;
  const overwrite =
    Math.abs(updated.length - fileText.length) <= 11111;
  if (overwrite) {
    fs.writeFileSync(filePath, updated, "utf-8");
    /*
    write0.call(
      process.stdout,
      "\n--\n" +
        JSON.stringify({
          filePath,
          fileText: fileText.length,
          startIndex,
          args,
          text,
        })
    );
    */
  }
}