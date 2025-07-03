import { ServerChunk } from "../lib/ServerChunk.js";
import { getProjectFolderPath } from "../utils/getProjectFolderPath.js";
import fs from 'fs';

async function parseJsonFromFile(target) {
  try {
    const fileContents = await fs.promises.readFile(target, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error parsing JSON from file:', error);
    throw error;
  }
}

async function init() {
  const data = await parseJsonFromFile('C:/Users/user/Desktop/world.json');
  const list = Object.entries(data).map(([pos, id])=>({pos: pos.split(',').map(a=>parseInt(a)), id}));
  const origin = list.reduce((acc, { pos }) => {
    acc[0] += pos[0];
    acc[1] = acc[1] === 0 || pos[1] < acc[1] ? pos[1] : acc[1];
    acc[2] += pos[2];
    return acc;
  }, [0, 0, 0]).map((a,i) => Math.round(a / (i===1?1:list.length)));
  console.log('Init world center:', origin);
  list.forEach((item => {
    item.pos = item.pos.map((a, i) => a - origin[i]);
  }));
  console.log('Parsed world data:', list.length, 'items');
  console.log('First 3 items:', list.slice(0, 3));
  for (let i = 0; i < list.length; i++) {
    const chunk = ServerChunk.fromAbsolute(list[i].pos);
    await chunk.set(...list[i].pos, list[i].id);
  }
  await ServerChunk.flushAll();
}

init().then(r=>(r !== undefined)&&console.log("init() return:", r)).catch(err => { console.log(err); process.exit(1); });

