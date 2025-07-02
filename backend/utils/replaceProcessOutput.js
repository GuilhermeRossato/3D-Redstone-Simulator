// import * as ext from 'file:///D:/dev/utils/replaceProcessOutput.js';
// export const replaceProcessOutput = ext.replaceProcessOutput;
// replaceProcessOutput();

// date time / process
const addDateLoc = true;
const addDateUtc = false;
const addMillis = 1;
const addPid = false;

// file path / file name
const addSourceName = false;
const addSourcePath = true;
const addSourceRelative = true;
const addSourceLine = true;
const addSourceCol = 0;
const removeInternalStackTraceLines = true;

// method name / source code
const addMethodName = 0;
const addSourceCode = 0;

// prettify / simplify
const clearSameDatePrefix = 0;
const clearSameSourcePrefix = 0;
const colorPrefixType = {
  date: "\x1b[35m",
  source: "\x1b[32m",
  code: "\x1b[36m",
};

const saveExecSyncOutputToFiles = true;

import fs from "fs";
import process from "process";
import net from "net";
import path from "path";
import child_process from "child_process";

const extraLogToFile = false;

/**
 * @param {string | string[] | Error | {stack: string}} lines
 * @param {boolean} [addLineCode]
 * @returns
 */
function interpretErrorStack(lines = [""], addLineCode = false) {
  const cwd = process.cwd().replace(/\\/g, "/").split("/");
  if (
    typeof lines === "object" &&
    !(lines instanceof Array) &&
    (lines instanceof Error || typeof lines.stack === "string")
  ) {
    lines = lines.stack;
  }
  if (typeof lines === "string") {
    lines = lines
      .replace(/\r\n/g, "\n")
      .replace(/\n\n+/g, "\n")
      .trim()
      .split("\n");
  }
  if (!(lines instanceof Array)) {
    throw new Error("Invalid argument");
  }
  const noMessage =
    lines[0] &&
    !lines[0].includes(":") &&
    !lines[0].includes(" ") &&
    lines[1] &&
    lines[1].startsWith(" ") &&
    lines[1].trim().startsWith("at ");
  const errorLineIndex = noMessage
    ? 0
    : lines.findIndex((l) => l.match(/[a-zA-Z0-9_]+\:\s/));
  const errorLine = lines[errorLineIndex] || ":";
  const errorName = errorLine.substring(
    0,
    noMessage ? errorLine.length : errorLine.indexOf(":")
  );
  const errorMessage = noMessage
    ? ""
    : errorLine.substring(errorLine.indexOf(":") + 2);

  let place;
  let placeOrigin = "";
  if (
    errorLineIndex === 0 &&
    lines[1] &&
    lines[1].startsWith(" ") &&
    lines[1].trim().startsWith("at ")
  ) {
    placeOrigin = lines[1];
  } else if (lines[0] && lines[0].startsWith("file:///")) {
    placeOrigin = lines[0];
  } else {
    placeOrigin = lines[errorLineIndex];
  }
  place = placeOrigin
    .substring(
      placeOrigin.indexOf("///") + 3,
      placeOrigin.lastIndexOf(".js") + 3
    )
    .replace(/\\/g, "/");
  let [line, column] = (
    placeOrigin.substring(placeOrigin.lastIndexOf(".js:") + 4) + ":"
  )
    .split(":")
    .map((v) => (v && v.length <= 5 && !v.match(/\D/g) ? parseInt(v) : NaN));
  const errorMarkerIndex = lines.findIndex(
    (l) =>
      l.startsWith(" ") &&
      l.trim().startsWith("^") &&
      l.trim().endsWith("^") &&
      l.trim().replace(/\^/g, "").length === 0
  );
  const errorMarker = lines[errorMarkerIndex];
  const errorMarkerCode = lines[errorMarkerIndex - 1];
  if (!column && errorMarker) {
    column = errorMarker.indexOf("^");
  }
  const stackIndex = lines.findIndex(
    (l) => l.startsWith(" ") && l.trim().startsWith("at ")
  );
  const relativeSourcePath = place.replace(
    process.cwd().replace(/\\/g, "/"),
    "."
  );
  const sourceRec = {};
  if (addLineCode && place) {
    const sourceText = addLineCode
      ? fs.readFileSync(path.resolve(place), "utf-8")
      : "";
    const sourceLines = sourceText
      .replace(/\n\r/g, "\n")
      .replace(/\r/g, "")
      .split("\n");
    sourceRec[path.resolve(place)] = sourceLines;
  }
  const stack = lines
    .map((line, index) => {
      if (index < stackIndex) return "";
      if (!line.trim().startsWith("at "))
        throw new Error(
          `Unexpected stack line start: ${JSON.stringify(
            line
          )} at index ${index} of ${JSON.stringify(lines)}`
        );
      return line;
    })
    .filter((f) => f?.length)
    .map((line) => {
      const raw = line
        .substring(line.indexOf("at "))
        .replace("at async ", "at ")
        .replace("at ", "");
      const open = raw.indexOf(" (");
      let place =
        open === -1 && raw.startsWith("file:///")
          ? raw
          : open === -1
          ? ""
          : raw.substring(open + 2, raw.lastIndexOf(")"));
      place = place.replace("file:///", "").replace(/\\/g, "/");
      if (!place.startsWith("node:internal") && place.startsWith(cwd[0])) {
        const parts = place.split("/");

        const result = [];
        for (let i = 0; i < cwd.length || i < parts.length; i++) {
          if (cwd[i] === parts[i]) continue;
          if (cwd[i] && result.length === 0)
            for (let j = i; j < cwd.length; j++) result.push("..");
          if (parts[i]) result.push(parts[i]);
        }
        place = `./${result.join("/")}`;
      }
      const obj = {
        async: raw.startsWith("at async "),
        method:
          open === -1 && raw.startsWith("file:///")
            ? ""
            : open === -1
            ? raw
            : raw.substring(0, open),
        place,
        line: NaN,
        column: NaN,
        internal: raw.includes("node:internal"),
        code: "",
      };
      obj.original = "";
      Object.defineProperty(obj, "original", {
        get() {
          return line;
        },
      });
      const a = obj.place.lastIndexOf(":");
      if (a + 5 >= obj.place.length) {
        const b = obj.place.lastIndexOf(":", a - 1);
        if (b + 5 >= a) {
          obj.line = parseInt(obj.place.substring(b + 1, a));
          obj.column = parseInt(obj.place.substring(a + 1));
          obj.place = obj.place.substring(0, b);
        } else {
          obj.line = parseInt(obj.place.substring(a + 1));
          obj.place = obj.place.substring(0, a);
        }
      } else {
        obj.line = NaN;
      }
      if (!obj.async) delete obj.async;
      if (!obj.internal) delete obj.internal;
      if (!obj.line) delete obj.line;
      if (!obj.column) delete obj.column;
      if (addLineCode && obj.line && obj.place && !obj.internal) {
        const src = path.resolve(obj.place);
        if (!sourceRec[src]) {
          try {
            const sourceText = addLineCode
              ? fs.readFileSync(path.resolve(src), "utf-8")
              : "";
            const sourceLines = sourceText
              .replace(/\n\r/g, "\n")
              .replace(/\r/g, "")
              .split("\n");
            sourceRec[src] = sourceLines;
          } catch (err) {
            sourceRec[src] = err;
          }
        }
        if (sourceRec[src] instanceof Error) {
          obj.code = sourceRec[src].message;
        } else if (
          sourceRec[src] instanceof Array &&
          sourceRec[src].length >= obj.line
        ) {
          obj.code = sourceRec[src][obj.line - 1];
        } else {
          obj.code = "";
        }
      }
      if (!obj.code) delete obj.code;
      return obj;
    });
  const obj = {
    place: relativeSourcePath,
    line,
    column,
    code: errorMarkerCode,
    mark: errorMarker,
    name: errorName,
    message: errorMessage,
    stack,
  };
  //obj.original = '';
  Object.defineProperty(obj, "original", {
    get() {
      return lines.join("\n");
    },
  });
  if (!obj.code) delete obj.code;
  if (!obj.mark) delete obj.mark;
  if (!obj.line) delete obj.line;
  if (!obj.column) delete obj.column;
  return obj;
}

// special debug
const _maxStackCount = 1;
const _skipReplacerStack = true;
const _skipColoredStack = true;
const _skipNodeInternalStack = true;
const _addStackAsJson = false;
const _addFullStackAsJson = 0;

let pendingPrefix = true;
let nl;

const _original = net.Socket.prototype.write;
const cache = {};

const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;

function removeInternalStackTraceLinesHandler(str = "") {
  const i = typeof str !== "string" ? -1 : str.indexOf("(node:internal");
  if (i === -1) return str;
  const j = str.indexOf(")", i + 1);
  if (j === -1) return str;
  const k = str.lastIndexOf("\n", i);
  let l = str.indexOf("\n", i + 1);
  let m = str.indexOf("\n", l + 1);
  let next = str.substring(l + 1, m);
  let m_old = -1;
  for (let i = 0; i < 64; i++) {
    if (
      next.includes("at ") &&
      (next.includes("(node:") || next.includes(" at node:internal"))
    ) {
      // console.log(m, [next]);
      m_old = m;
      //  console.log(i, m + 1);
      m = str.indexOf("\n", m + 1);
      next = m === -1 ? "" : str.substring(m_old + 1, m);
    } else break;
  }
  if (m_old !== -1) m = m_old;
  next = str.substring(m + 1, str.length);
  if (
    next.includes("at ") &&
    (next.includes("(node:") || next.includes(" at node:internal"))
  ) {
    let nl = str.indexOf("\n", m + 1);
    if (nl === -1) {
      nl = str.length;
    }
    m = nl;
  }
  str = [str.substring(0, k), str.substring(m)].join("");
  return str;
}

// replaceProcessOutput();

function appendTextPrefixRec(
  text = "",
  now = new Date().getTime(),
  realStack = undefined
) {
  if (pendingPrefix) {
    const prefix = [];
    if (addDateLoc) {
      prefix.push({
        type: "date",
        value: new Date(now - tzOffset)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19 + (addMillis ? 4 : 0)),
      });
    } else if (addDateUtc) {
      prefix.push({
        type: "date",
        value:
          new Date(now).toISOString().substring(0, 19 + (addMillis ? 4 : 0)) +
          "Z",
      });
    } else if (addMillis) {
      prefix.push({
        type: "date",
        value: new Date(now).toISOString().substring(0, 20),
      });
    }
    if (addPid) {
      prefix.push({ type: "pid", value: process.pid });
    }
    if (_addFullStackAsJson) {
      const stack = interpretErrorStack(
        realStack ? realStack : (realStack = new Error("")),
        Boolean(addSourceCode)
      );
      prefix.push({ type: "stack", value: stack });
    } else if (
      addSourceName ||
      addSourcePath ||
      addSourceRelative ||
      addMethodName ||
      Boolean(addSourceCode)
    ) {
      const interpreted = interpretErrorStack(
        realStack ? realStack : (realStack = new Error("").stack),
        Boolean(addSourceCode)
      );

      let stack = interpreted?.stack;

      // Skip stacks related to this script
      if (_skipReplacerStack) {
        // Assert first on stack is the line above
        if (stack[0].method !== appendTextPrefixRec.name) {
          throw new Error(
            `Unexpected initial stack method: ${JSON.stringify(stack[0])}`
          );
        }
        // Remove imediate stack
        if (stack[0].method === appendTextPrefixRec.name) {
          stack.shift();

          // Remove recursive call
          if (stack[0].method === appendTextPrefixRec.name) {
            const place = stack[0].place;
            const line = stack[0].line;
            stack.shift();
            if (stack[0]?.method === appendTextPrefixRec.name) {
              if (stack[0].place === place && stack[0].line === line) {
                //prefix.push({ type: "test", value: "[recursive]" });
              }
              stack.shift();
            }
          }
        }
        // Remove call from replaced net.Socket.write
        if (stack[0].method === "net.Socket.write") {
          stack.shift();
        }
      }
      if (_skipNodeInternalStack) {
        stack = stack.filter((s) => !s.internal);
      }
      if (_skipColoredStack) {
        if (stack[0]?.method === "colored") {
          stack.shift();
        }
      }

      if (!_addStackAsJson) {
        const relevant = stack.slice(0, _maxStackCount).map((entry) => {
          const { place, method, line, column, internal, code } = entry;
          let sufix =
            addSourceLine && line && addSourceCol && column
              ? `:${line}:${column}`
              : addSourceLine && line
              ? `:${line}`
              : "";
          if (sufix && place) {
            cache[place] = Math.max(
              cache[place] ? cache[place] : 0,
              sufix.length
            );
            if (sufix.length < cache[place]) {
              sufix = sufix.padEnd(cache[place], " ");
            }
          }
          return {
            src:
              addSourceRelative && !internal
                ? (place.startsWith("./../") ? place.substring(2) : place) +
                  sufix
                : addSourcePath && !internal
                ? path.resolve(place).replace(/\\/g, "/") + sufix
                : addSourcePath
                ? place + sufix
                : addSourceName
                ? place.split("/").pop() + sufix
                : undefined,
            method: addMethodName && method ? `[${method}]` : undefined,
            code: addSourceCode ? code : undefined,
          };
        });
        const before = [...prefix].map((a, i) => ({
          type: "padding",
          value:
            typeof a.value === "string"
              ? (i === 0 ? "\n" : "") + " ".repeat(a.value.length)
              : "?",
          padding: true,
        }));
        relevant.forEach(({ src, method, code }, i) => {
          if (i !== 0) prefix.push(...before);
          prefix.push({
            type: "stack",
            value: [src, method, code ? `| ${code}` : ""]
              .filter(Boolean)
              .join(" "),
          });
        });
      } else {
        prefix.push({ type: "stack", value: stack.slice(0, _maxStackCount) });
      }
    }

    if (clearSameDatePrefix && (addDateLoc || addDateUtc || addMillis)) {
      //const size = (addDateLoc || addDateUtc ? 19 : 0) + (addMillis ? 4 : 0);
      const match = prefix.find((f) => f.type === "date");
      if (!match || typeof match?.value !== "string") {
        // Invalid match
      } else if (match && match.value && cache["lastDate"]) {
        if (match.value === cache["lastDate"]) {
          match.value = " ".repeat(match.value.length);
        } else if (
          match.value.length > 19 &&
          match.value.substring(0, 19) === cache["lastDate"].substring(0, 19)
        ) {
          match.value = " ".repeat(19) + match.value.substring(19);
        } else {
          cache["lastDate"] = match?.value || "";
        }
      } else {
        cache["lastDate"] = match?.value || "";
      }
    }
    if (
      clearSameSourcePrefix &&
      (addSourceName || addSourcePath || addSourceRelative)
    ) {
      const match = prefix.find((f) => f.type === "stack");
      if (match && match.value && cache["lastSource"]) {
        const i =
          typeof match.value === "string" ? match.value.indexOf(".js") : -1;
        const j =
          typeof cache["lastSource"] === "string"
            ? cache["lastSource"].indexOf(".js")
            : -1;

        if (
          i === j &&
          i !== -1 &&
          j !== -1 &&
          typeof match.value === "string" &&
          match.value.substring(0, i + 3) ===
            cache["lastSource"].substring(0, i + 3)
        ) {
          match.value = " ".repeat(i + 3) + match.value.substring(i + 3);
        } else {
          cache["lastSource"] = match?.value || "";
        }
      } else {
        cache["lastSource"] = match?.value || "";
      }
    }

    let extra = prefix
      .map((obj) => {
        //return obj
        if (typeof obj !== "object" || !obj.type) {
          throw new Error(`Unknown prefix entry: ${JSON.stringify(prefix)}`);
        }
        const reset = "\x1b[0m";
        const text =
          typeof obj.value === "string"
            ? obj.value
            : obj
            ? JSON.stringify(obj.value, null, "  ")
            : "";
        if (obj.type === "stack") {
          const c1 = colorPrefixType?.["source"];
          const i = text.indexOf(".js");
          if (i <= -1) {
            return text;
          }
          const left = c1
            ? [c1, text.substring(0, i + 3), reset].join("")
            : text.substring(0, i + 3);
          const j = text.indexOf("|", i + 3);
          const c2 = colorPrefixType?.["code"];
          if (j <= -1 || !c2) {
            return left + text.substring(i + 3);
          }
          const mid = text.substring(i + 3, j + 1);
          return left + mid + [c2, text.substring(j + 1), reset].join("");
        } else {
          const color = colorPrefixType?.[obj.type];
          return color ? `${color}${text}${reset}` : text;
        }
      })
      .map(
        (s, i, a) =>
          (typeof s !== "string" ? JSON.stringify(s) : s) +
          (a[i + 1] ? " " : "")
      )
      .join("");

    // colorDatePrefix
    // colorSourcePrefix
    // colorCodePrefix
    // clearSameDatePrefix
    // clearSameSourcePrefix

    text = `${extra} ${text}`;
    nl = text.indexOf("\n", extra.length + 1);
  } else {
    nl = text.indexOf("\n");
  }
  pendingPrefix = nl !== -1;
  if (!pendingPrefix) return text;
  if (nl + 1 === text.length) return text;
  return (
    text.substring(0, nl + 1) +
    appendTextPrefixRec(text.substring(nl + 1), now, realStack)
  );
}

let paused = false;

export function setPauseState(isPaused) {
  paused = Boolean(isPaused);
}

let count = 0;
export function replaceProcessOutput(outputFilePath = "") {
  if (saveExecSyncOutputToFiles) {
    const original = child_process.execSync;
    child_process.execSync = function (...args) {
      try {
        if (outputFilePath) {
          try {
            fs.appendFileSync(
              outputFilePath,
              `${new Date().toISOString()} > ${args[0]}\n`,
              "utf-8"
            );
          } catch (err) {
            // ignore
          }
        }
        const result = original.call(child_process, ...args);
        const text =
          result instanceof Buffer
            ? result.toString("utf-8")
            : typeof result === "string"
            ? result
            : "";
        if (outputFilePath && text) {
          try {
            fs.appendFileSync(outputFilePath, `${text}\n`, "utf-8");
          } catch (err) {
            // ignore
          }
        }
        return result;
      } catch (err) {
        let stdout = err?.stdout || err?.output[1];
        stdout =
          stdout instanceof Buffer
            ? stdout.toString("utf-8")
            : typeof stdout === "string"
            ? stdout
            : "";
        let stderr = err?.stderr || err?.output[2];
        stderr =
          stderr instanceof Buffer
            ? stderr.toString("utf-8")
            : typeof stderr === "string"
            ? stderr
            : "";
        if (outputFilePath) {
          try {
            fs.appendFileSync(
              outputFilePath,
              `Failed with exit code ${err?.status} and ${
                stdout.length
              } bytes of output${stdout.length ? ":\n" + stdout : ""}\n`,
              "utf-8"
            );
          } catch (err) {
            // ignore
          }
        }
        throw err;
      }
    };
  }

  const original = !outputFilePath
    ? _original
    : function (...args) {
        // @ts-ignore
        const fd = this.fd;
        if (typeof args[0] !== "string" || typeof fd !== "number")
          return _original.call(this, ...args);
        const uncolored = args[0]
          .replace(/\u001B\[\d+m/g, "")
          .replace(/\x1b\[\d+m/g, "")
          .replace(/\[\d+m/g, "");
        if ((fd === 1 || fd === 2) && outputFilePath) {
          try {
            fs.appendFileSync(outputFilePath, uncolored, "utf-8");
          } catch (err) {
            outputFilePath = null;
          }
        }
        return _original.call(this, ...args);
      };
  let inside = false;
  net.Socket.prototype.write = function (arg, ...args) {
    if (paused) {
      return original.call(this, arg, ...args);
    }
    // @ts-ignore
    const fd = this.fd;
    try {
      extraLogToFile &&
        fd.appendFileSync(
          "./log.jsonl",
          JSON.stringify({
            date: new Date().toISOString(),
            count: count++,
            size: args.length + 1,
            // @ts-ignore
            fd,
            inside,
            // @ts-ignore
            _isStdio: this._isStdio,
            // @ts-ignore
            rows: this.rows,
            // @ts-ignore
            columns: this.columns,
            keys: Object.keys(this),
            args: [arg, ...args].map((a) =>
              a instanceof Buffer ? "(buffer)" + a.toString("utf-8") : a
            ),
          }) + ",\n",
          "utf-8"
        );
    } catch (err) {
      try {
        extraLogToFile &&
          fd.appendFileSync(
            "./log.jsonl",
            JSON.stringify({
              date: new Date().toISOString(),
              count: count++,
              error: err?.stack,
            }) + ",\n",
            "utf-8"
          );
      } catch (_err) {
        // Ignore
      }
    }
    try {
      if (!inside && (fd === 1 || fd === 2)) {
        inside = true;
        if (arg instanceof Buffer && typeof args[0] === "string") {
          arg = arg.toString(args.shift());
        }
        if (
          arg instanceof Buffer &&
          typeof args[0] === "function" &&
          args[1] === undefined
        ) {
          arg = arg.toString("utf-8");
        }
        if (typeof arg === "string" && removeInternalStackTraceLines) {
          arg = removeInternalStackTraceLinesHandler(arg);
        }
        if (typeof arg === "string") {
          try {
            arg = appendTextPrefixRec(arg, undefined);
          } catch (err) {
            arg = String(err?.stack || err?.message || err);
          }
          inside = false;
          return original.call(this, arg, ...args);
        }
        inside = false;
      }
      inside = false;
      return original.call(this, arg, ...args);
    } catch (err) {
      inside = false;
      try {
        extraLogToFile &&
          fd.appendFileSync(
            "./log.jsonl",
            JSON.stringify({
              date: new Date().toISOString(),
              count: count++,
              error: err?.stack,
            }) + ",\n",
            "utf-8"
          );
      } catch (_err) {
        // Ignore
      }
    }
  };
}
