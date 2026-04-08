import fs from 'fs';
import path from 'path';
import process from 'process';

export function generateChunkDistanceSequence(side = 64) {
  if (side > 64) {
    throw new Error("Side length must not be greater than 64");
  }
  console.log("Generating chunk distance sequence with side length:", side);
  let steps = 0;
  /** @type {Record<string, Set<string>>}  */
  const record = {};
  for (let x = -side; x <= side; x++) {
    for (let y = -side; y <= side; y++) {
      for (let z = -side; z <= side; z++) {
        steps++;
        const distance = Math.pow(
          x * x + y * y + z * z, 1 / 3
        );
        const key = distance.toFixed(2);
        if (!record[key]) {
          record[key] = new Set();
        }
        record[key].add(`${x},${y},${z}`);
      }
    }
  }
  console.log("Generating chunk distance list after", steps, "steps");
  /** @type {{dist: number, chunks: string[]}[]}  */
  const list = Object.entries(record).map(([key, chunks]) => ({ dist: parseFloat(key), chunks: Array.from(chunks) })).sort((a, b) => a.dist - b.dist);
  console.log("Created chunk distance list with", list.length, "unique distances");
  return { record, list, steps };
}

/**
 * 
 * @param {ReturnType<typeof generateChunkDistanceSequence>} result 
 */
export function createChunkDistanceStaticFiles(result) {
  let p = process.cwd();
  let list = fs.readdirSync(p);
  for (let i = 0; i < 3 && p.length > 1; i++) {
    if (list.includes('frontend') && list.includes('backend') && list.includes('README.md')) {
      p = path.join(p, 'backendc', 'static');
      break;
    }
    if (list.includes('.env') && list.includes('lib') && list.includes('utils') && list.includes('package.json')) {
      p = path.join(p, 'static');
      break;
    }
    if (p.endsWith('backend/scripts') || p.endsWith('backend\\scripts')) {
      p = path.join(path.dirname(p), 'static');
      break;
    }
    p = path.dirname(p);
    list = fs.readdirSync(p);
  }
  if (!p.endsWith('static')) {
    throw new Error('Could not find static directory in the project root');
  }
  const prefix = path.join(p, 'chunk-distances');
  try {
    if (!fs.existsSync(path.dirname(prefix))) {
      fs.mkdirSync(path.dirname(prefix));
    }
    if (!fs.existsSync(prefix)) {
      fs.mkdirSync(prefix);
    }
  } catch (e) {
    // Ignore directory creation error
  }
  const chunkSize = 128;
  const amount = Math.ceil(result.list.length / chunkSize);
  console.log("Creating", result.list.length, "chunk positions");
  for (let i = 0; i <= amount + 1; i++) {
    const target = path.join(prefix, `group_${i}.json`);
    if (i >= amount) {
      try {
        fs.unlinkSync(target);
        console.log('Removed old file:', target);
      } catch (e) {
        // Ignore unlink error
      }
      continue;
    }
    const list = result.list.slice(i * chunkSize, (i + 1) * chunkSize);
    const rec = Object.fromEntries(list.map(({ dist, chunks }) => [dist.toString().substring(0, '10.00'.length), chunks]));
    const buffer = Buffer.from(JSON.stringify(rec), 'utf-8');
    fs.writeFileSync(target, buffer);
    console.log('Wrote', buffer.byteLength, 'bytes (', Math.floor(buffer.byteLength / 1024), 'KB) to target file:', target);
  }
  console.log('Chunk distance files created', amount == 0 ? "nothing" : amount, 'files in:', prefix);
}

createChunkDistanceStaticFiles(generateChunkDistanceSequence(32));