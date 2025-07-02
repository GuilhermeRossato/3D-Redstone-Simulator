export function applyEventOnEntityData(obj, event) {
  if (
    !obj ||
    typeof obj !== "object" ||
    !obj.id ||
    !event.key ||
    event.key === "id" ||
    event.key === "events" ||
    event.key === "section" ||
    event.key === "apply" ||
    !event.time ||
    !event.key
  ) {
    throw new Error(`Invalid event update: ${JSON.stringify(event)}`);
  }
  if (!(obj.events instanceof Array)) {
    obj.events = [];
  }
  obj.events.push(event);
  if (
    event.value === undefined ||
    event.value === null ||
    event.value === "" ||
    (event.value instanceof Array && event.value.length === 0)
  ) {
    delete obj[event.key];
  } else {
    obj[event.key] = event.value;
  }
  return obj;
}

function randDigit(a = 16, b = 16) {
  return Math.floor(Math.random() * a).toString(b);
}

/**
 * @param {string | {section?: string, x?: number, y?: number, z?: number, cx?: number, cy?: number, cz?: number} | number[] | {pose: {section?: string, x?: number, y?: number, z?: number, cx?: number, cy?: number, cz?: number} | number[]}} arg
 * @returns {string}
 */
function getSectionCode(arg) {
  /** @type {any} */
  let any = arg;
  if (
    typeof any === "object" &&
    typeof any.section === "string" &&
    any.section.length === 3 &&
    any.section.match(/^[a-z]{3}$/)
  ) {
    return any.section;
  }
  if (typeof any === "string" && any.length === 3 && any.match(/^[a-z]{3}$/)) {
    return any;
  }
  if (
    typeof any === "string" &&
    any.indexOf("-") >= 3 &&
    any
      .substring(any.indexOf("-") - 3)
      .substring(0, 3)
      .match(/^[a-z]{3}$/)
  ) {
    return any.substring(any.indexOf("-") - 3).substring(0, 3);
  }
  if (any?.pose instanceof Array) {
    any = any.pose;
  } else if (
    typeof any?.x === "number" &&
    !isNaN(any?.x) &&
    typeof any?.y === "number" &&
    !isNaN(any?.y) &&
    typeof any?.z === "number" &&
    !isNaN(any?.z)
  ) {
    any = [any.x, any.y, any.z].map((c) => Math.floor(c));
  } else if (
    typeof any?.cx === "number" &&
    !isNaN(any?.cx) &&
    typeof any?.cy === "number" &&
    !isNaN(any?.cy) &&
    typeof any?.cz === "number" &&
    !isNaN(any?.cz)
  ) {
    any = [any.cx, any.cy, any.cz].map((c) => Math.floor(c) * 16);
  }
  if (any?.[0] === 0 && any?.[1] === 0 && any?.[2] === 0) {
    return "000";
  }
  if (isNaN(any?.[0]) || isNaN(any?.[1]) || isNaN(any?.[2])) {
    return "000";
  }
  if (!any?.[0] && !any?.[1] && !any?.[2]) {
    return Math.floor(1 + Math.random() * 4)
      .toString()
      .repeat(3);
  }
  if (isNaN(any?.[0]) || isNaN(any?.[1]) || isNaN(any?.[2])) {
    return Math.floor(6 + Math.random() * 4)
      .toString()
      .repeat(3);
  }
  if (!(any instanceof Array)) {
    return "555";
  }
  return any
    .slice(0, 3)
    .map((v) => Math.floor(97 + 26 * ((((v / 32) % 64) + 64) / 128)))
    .map((code) => String.fromCharCode(Math.max(97, Math.min(code, 122))))
    .join("");
}

export function createEntityPair(obj) {
  const section = getSectionCode(obj);
  if (section.length !== 3) {
    throw new Error(`Invalid section: ${JSON.stringify(section)}`);
  }
  const date = String(Math.floor(obj.created || Date.now()));
  return {
    id: `${String(obj.parent?.[obj.parent?.length - 1] || "0")}${date.substring(
      date.length - 6
    )}${randDigit()}${randDigit()}`,
    section,
  };
}
