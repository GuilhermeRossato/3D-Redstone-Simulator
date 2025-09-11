export function convertBlockListToBlockRecord(blockList) {
  const list = [];

  if (typeof blockList === 'string') {
    let start = 0;
    for (let i = 1; i <= blockList.length; i++) {
      if (i === blockList.length || blockList.charAt(i) === 'x') {
        list.push(blockList.substring(start, i));
        start = i;
        continue;
      }
    }
    return convertBlockListToBlockRecord(list);
  }
  if (blockList && typeof blockList === 'object' && Array.isArray(blockList)) {
    for (let i = 0; i < blockList.length; i++) {
      const entry = blockList[i];
      if (entry && typeof entry === 'string') {
        let start = -1;
        const obj = {};
        let key = '';
        for (let j = 0; j <= entry.length; j++) {
          if (j === entry.length || entry.charAt(j) === 'x') {
            if (start != -1 && j > start && key) {
              const num = parseInt(entry.substring(start, j));
              obj[key] = isNaN(num) ? 0 : num;
            }
            key = entry.charAt(j);
            start = -1;
            continue;
          }
          const code = entry.charCodeAt(j);
          const digit = (code >= 48 && code <= 57);
          if (digit) {
            start = start === -1 ? j : start;
            continue;
          }
          if (start === -1) {
            key = key + entry.charAt(j);
            continue;
          }
        }
        console.log(`Parsed block entry: ${JSON.stringify(entry)} to`, obj);
        if (obj.id > 0) {
          list.push([obj.x || 0, obj.y || 0, obj.z || 0, obj.id]);
        }
      } else if (entry && typeof entry === 'object') {
        const x = entry.x || entry[0];
        const y = entry.y || entry[1];
        const z = entry.z || entry[2];
        const id = entry.id || entry[3];
        const data = entry.data || entry[4];
        list.push([x, y, z, id, data]);
      } else {
        throw new TypeError(`Invalid block list entry at index ${i}: ${JSON.stringify(entry)}`);
      }
    }
  }
  const blocks = {};
  for (const entry of list) {
    if (!(entry instanceof Array) || entry.length < 4 || isNaN(entry[0]) || isNaN(entry[1]) || isNaN(entry[2]) || isNaN(entry[3])) {
      throw new TypeError(`Invalid block list entry: ${JSON.stringify(entry)}`);
    }
    if (entry[3] <= 0) continue;
    const [x, y, z, id] = entry;
    if (!blocks[x]) {
      blocks[x] = {};
    }
    if (!blocks[x][y]) {
      blocks[x][y] = {};
    }
    if (!blocks[x][y][z]) {
      blocks[x][y][z] = Object.fromEntries(Object.entries(entry).filter(([k, v]) => !["x", "y", "z"].includes(k) && Boolean(v)));
    } else {
      throw new Error(`Duplicate block position in block list: ${x},${y},${z}`);
    }
  }
  return blocks;
}
