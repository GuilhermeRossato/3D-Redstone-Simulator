import fs from 'fs';
import { getProjectFolderPath } from '../utils/getProjectFolderPath.js';

const MAX_CACHE_FILE_COUNT = 4;

const localCache = new Map();

let cache;
export async function getChunkOffsetCache(forceReset = false) {
  if (!cache || forceReset) {
    const parent = getProjectFolderPath("backend", "data", "cache");
    const files = await fs.promises.readdir(parent);
    const list = files.filter(f => f.startsWith("chunkOffsets") && f.endsWith(".js")).map(f => ({
      path: `${parent}/${f}`,
      last: parseInt(f.match(/chunkOffsets(\d+)\.js/)[1], 10),
      distances: null,
      offsets: null,
      counts: null,
    })).sort((a, b) => a.last - b.last);
    cache = list;
  }
  return cache;
}

if (process.argv[1].endsWith('chunkDistance.js')) {
  //generateJsChunkOffsetCache().then(r=>(r !== undefined)&&console.log("test() return:", r)).catch(err => { console.log("test() failed:",err); process.exit(1); });
  console.log(await getChunkOffsets(32, 10));
}

export async function getChunkOffsets(maxCount = 64, maxDistance = 16) {
  const cacheKey = `${maxCount}-${maxDistance}`;
  if (localCache.has(cacheKey)) {
    return localCache.get(cacheKey);
  }

  const result = [];
  const list = await getChunkOffsetCache();
  for (const file of list) {
    if (!file.distances) {
      const module = await import(`file:///${file.path}`);
      file.distances = module.distances;
      file.counts = module.counts;
      file.offsets = module.offsets;
    }
    for (let i = 0; i < file.offsets.length; i++) {
      if (maxDistance && file.distances[i] > maxDistance) {
        localCache.set(cacheKey, result);
        return result;
      }
      for (let j = 0; j < file.offsets[i].length; j++) {
        if (maxCount && result.length >= maxCount) {
          localCache.set(cacheKey, result);
          return result;
        }
        result.push(file.offsets[i][j] + ',' + file.distances[i]);
      }
    }
  }

  localCache.set(cacheKey, result);
  if (localCache.size > 64) {
    const oldestKey = Array.from(localCache.keys())[0];
    localCache.delete(oldestKey);
  }
  return result;
}

async function generateJsChunkOffsetCache() {
  const parent = getProjectFolderPath('backend', 'data', 'cache');
  await fs.promises.mkdir(parent, { recursive: true });
  console.log('Generating distance sequence...');
  const list = generateChunkDistanceSequence(48);
  console.log('Got list with', list.length, "distances.");
  let from = 0;
  let j = 0;
  let size = 0;
  console.log('Writing chunk offset files...');
  for (let i = 0; i < list.length; i++) {
    const { chunks } = list[i];
    const chunkArray = Array.from(chunks.values());
    const json = JSON.stringify(chunkArray);
    size += json.length;
    if (size >= 8*1024 || i+1=== list.length) {
      const counts = list.slice(from, i).map((a,i)=>list.slice(0, from+i).map(a=>a.chunks.size).reduce((a,b)=>a+b, 0));
      const text = [
        `/* Generated code by chunkDistance.js */\n`,
        `export const distances = [${list.slice(from, i).map(a=>a.dist).map(a=>JSON.stringify(a)).join(', ')}];`,
        '',
        `export const counts = [${counts.map(a=>JSON.stringify(a)).join(', ')}];`,
        '',
        `export const offsets = [\n  ${list.slice(from, i).map(a=>Array.from(a.chunks)).map(a=>JSON.stringify(a)).join(',\n  ')}\n];`,
        '',
      ].join('\n');
      const target = `${parent}/chunkOffsets${counts[counts.length-1]}.js`;
      await fs.promises.writeFile(target, text, 'utf-8');
      console.log('Finished writing', text.length, 'chars to', target);
      from = i;
      j++;
      size = 0;
      if (j === MAX_CACHE_FILE_COUNT) break;
    }
  }
  console.log('Finished');
}


async function generateCsvChunkOffsetCache() {
  const parent = getProjectFolderPath('backend', 'data', 'cache');
  await fs.promises.mkdir(parent, { recursive: true });
  console.log('Generating distance sequence...');
  const list = generateChunkDistanceSequence(48);
  console.log('Got list with', list.length, "distances.");
  let j = 0;
  let size = 0;
  let lastTarget;
  console.log('Writing chunk offset files...');
  for (let i = 0; i < list.length; i++) {
    const { dist, chunks } = list[i];
    //process.stdout.write(i % 4 === 0?'\nDist ':' ');
    //process.stdout.write(`${dist} has ${chunks.size} chunks.`);
    const text = [i, dist, ...Array.from(chunks.values())].join('\t')+'\n';
    const target = `${parent}/chunk-offsets-${j}.tsv`;
    await fs.promises[size===0?"writeFile":"appendFile"](target, text, 'utf-8');
    size += text.length;
    if (size >= 4*1024*1024) {
      console.log('Overflow of', size, 'bytes on chunk-offsets-'+j+'.tsv');
    }
    if (size >= 1*1024*1024) {
      console.log('Finished writing', size, 'bytes to chunk-offsets-'+j+'.tsv');
      j++;
      size = 0;
      if (j === MAX_CACHE_FILE_COUNT) break;
    }
  }
    if (size > 1) {
      console.log('Finished writing', size, 'bytes to chunk-offsets-'+j+'.tsv');
    }
}

function generateChunkDistanceSequence(side = 64) {
  const record = generateChunkDistanceRecord(side);
  const list = Object.entries(record).map(([key, chunks]) => ({ dist: parseFloat(key), chunks })).sort((a, b) => a.dist - b.dist);
  console.log('Generated', list.length, 'chunk distance records. First:', list[0]);
  return list;
}

function generateChunkDistanceRecord(side = 64) {
  /** @type {Record<string, Set<string>>}  */
  const record = {};
  let steps = 0;
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
  console.log({ steps })
  return record;
}
