const regexPattern = /\Wat\s\w/g;

/**
 * @param {string | string[] | Error | {stack?: string, message?: string, error?: string}} [raw]
 */
export function getCurrentStackList(raw) {
  let name = "";
  let message = "";
  let text = "";

  if (!raw) {
    text = new Error("a").stack || "";
  } else if (typeof raw === "string") {
    text = raw;
  } else if (raw instanceof Array) {
    text = raw.join("\n");
  } else if (raw && typeof raw === "object") {
    text = raw.stack || raw.message || raw["error"] || "";
  }

  const length = text.length;

  const isId = (index = 0) =>
    index < 0 || index > length
      ? false
      : [text.charCodeAt(index)].every(
          (c) =>
            c === 97 ||
            (c >= 48 && c <= 57) ||
            (c >= 65 && c <= 90) ||
            (c >= 97 && c <= 122)
        );

  let i = text.indexOf(":");
  let j = i;
  for (let cc = 0; cc < length && isId(j - 1); cc++) {
    j--;
  }
  if (i !== -1 && j !== -1 && j < i) {
    name = text.substring(j, i);
    // console.log("name:", [name], {i, j}); /* DEBUG */
  }
  const ats = [];
  text.replace(regexPattern, (match, offset) => {
    if (typeof offset !== "number") {
      throw new Error(`Unexpected offset argument: ${JSON.stringify(offset)}`);
    }
    if (
      ats.length === 0 &&
      i !== -1 &&
      j !== -1 &&
      typeof offset === "number"
    ) {
      message = text.substring(i + 1, offset).trim();
      // console.log("message:", [message], {i: i + 1, j: offset}); /* DEBUG */
    }
    // (ats.length === 1) && console.log("first:", [text.substring(ats[0], offset).trim()], {i: ats[0], j: offset}); /* DEBUG */
    ats.push(offset);
    return match;
  });
  const list = ats.map((index, i, ats) => {
    const end = ats[i + 1] || length;
    const original = text.substring(index + 4, end);
    const line = original.trim();
    const start = line.indexOf(" (");
    return {
      // meta: {original, index}, /* DEBUG */
      method: start === -1 ? "" : line.substring(0, start),
      source:
        start === -1 ? line : line.substring(start + 2, line.lastIndexOf(")")),
    };
  });
  const stackList = list.map((old) => {
    const s = old.source;
    const m = old.method;
    const obj = {
      // meta: old.meta, /* DEBUG */
      method: m,
      async: m.startsWith("async ") || undefined,
      type: "",
      path: "",
      name: "",
      line: NaN || undefined,
      col: NaN || undefined,
    };
    if (obj.async) {
      obj.method = obj.method.substring(6);
    } else {
      delete obj.async;
    }
    const t = s.startsWith("node:")
      ? s.indexOf("/")
      : s.includes(":///")
      ? s.indexOf(":///")
      : 0;
    obj.type = t === -1 ? "file" : s.substring(0, t);
    const lastSep = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\"));
    let i = lastSep;
    if (i >= t && i !== -1) {
      obj.name = s.substring(i + 1);
      i = obj.name.indexOf(":");
      if (i !== -1) {
        const line = obj.name.substring(i + 1);
        obj.name = obj.name.substring(0, i);
        i = line.indexOf(":");
        if (i === -1) {
          obj.line = parseInt(line);
        } else {
          obj.col = parseInt(line.substring(i + 1));
          obj.line = parseInt(line.substring(0, i));
        }
      }
    }
    obj.path =
      s.substring(
        s.substring(t, t + 4) === ":///" ? t + 4 : t,
        lastSep === -1 ? s.length : lastSep + 1
      ) + (lastSep === -1 || !obj.name ? "" : obj.name);
    for (const key in obj) if (!obj[key]) delete obj[key];
    return obj;
  });
  return {
    name,
    message,
    stack: stackList,
  };
}
