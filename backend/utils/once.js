const rec = {};

/**
 * Log only once
 * @param {*} key 
 * @param  {...any} args 
 * @returns 
 */
export function once(key, ...args) {
  if (rec[String(key)]) {
    return;
  }
  rec[String(key)] = true;
  for (const a of args) {
    if (typeof a !== "function") {
      throw new Error("Once arguments must be functions");
    }
    let r = a();
    if (typeof r === "string") {
      r = [r];
    }
    if (!(r instanceof Array)) {
      throw new Error(
        `Once function must return a string or a string array (got ${typeof r})`
      );
    }
    console.log(`[${String(key)}]`, ...r);
  }
}
