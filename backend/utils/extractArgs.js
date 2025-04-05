/**
 * Extracts sequential arguments from the program arguments if they match a specific value (or any from a list).
 * @param {string | string[] | string[][]} name - Value or list of values to match in the arguments.
 * @param {number} offset - Number of arguments after the matched argument to extract and include in the result.
 * @param {string[]} argv - Optional list of arguments to search in and remove from (with the splice method).
 * @returns {string[]} - Sequential arguments from the match, or an empty array if not found.
 */
export function extractArgs(name, offset = 0, argv = []) {
  if (!argv || !argv?.length) {
    argv = process.argv;
  }
  const list = (
    typeof name === "string"
      ? name.split("/")
      : name instanceof Array
      ? name
      : [name]
  )
    .flatMap((a) => (a instanceof Array ? a : a ? [String(a)] : []))
    .flatMap((a) => (a ? [String(a)] : []))
    .flatMap((a) =>
      typeof a === "string" && a.trim().length
        ? [a.startsWith("-") ? a : a.length === 1 ? `-${a}` : `--${a}`]
        : []
    );

  const i = list.map((elem) => argv.indexOf(elem)).find((i) => i !== -1);
  return i && typeof i === "number" ? argv.splice(i, 1 + offset) : [];
}
