import fs from "fs";
import path from "path";

const debug = false;

/**
 * Assycronously iterates a directory and its subdirectories, returning an array of objects with the path, depth and stat of each file
 *
 * @param {string} target
 * @param {string[] | ((path: string) => (boolean | Promise<boolean>)) | null} [filter] A file name blacklist array or a function that decides whether or not to include the node on the list
 * @param {{path: string, depth: number, stat: fs.Stats}[]} [array] A starting array
 * @param {number} [maxDepth]
 * @param {number} [depth]
 * @returns {Promise<{path: string, depth: number, stat: fs.Stats}[]>}
 */
export default async function recursiveDirectoryIterate(
  target,
  filter = () => true,
  array = [],
  maxDepth = 64,
  depth = 0
) {
  debug && console.log("[D]", depth, target);
  if (depth > maxDepth) {
    return array;
  }
  try {
    let normalized = (
      (target !== "/" && target.endsWith("/")) || target.endsWith("\\")
        ? target.substring(0, target.length - 1)
        : target
    ).replace(/\\/g, "/");
    if (normalized.endsWith("/.")) {
      normalized = normalized.substring(0, normalized.length - 2);
    }
    if (
      filter instanceof Array &&
      !filter.includes(path.basename(normalized))
    ) {
      debug && console.log("[D]", "File filtered out:", normalized);
      return array;
    }
    if (typeof filter === "function") {
      const veredict = filter(normalized);
      if (!veredict || (veredict instanceof Promise && !(await veredict))) {
        debug && console.log("[D]", "File filtered out:", normalized);
        return array;
      }
    }
    const stat = await fs.promises.stat(normalized);
    const match = array.find(({ path }) => path === normalized);
    if (match) {
      match.stat = stat;
    } else {
      array.push({ path: target, depth, stat });
    }
    if (stat.isFile()) {
      return array;
    }
    const nodes = await fs.promises.readdir(target);
    for (const name of nodes) {
      const next = `${normalized}/${name}`;
      await recursiveDirectoryIterate(next, filter, array, maxDepth, depth + 1);
    }
  } catch (err) {
    debug && console.log("[D]", "Recursive directory error", err);
  }
  return array;
}
