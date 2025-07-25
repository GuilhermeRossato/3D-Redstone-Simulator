import * as THREE from '../libs/three.module.js';
import * as PlayerModel from '../models/PlayerModel.js';
import { b, ib } from '../utils/bezier.js';
import { g } from '../utils/g.js';
import { scene } from './GraphicsHandler.js';
import { setPlayerPosition } from './InputHandler.js';

/**
 * @typedef {{x: number, y: number, z: number; yaw?: number; pitch?: number}} PositionEntry
 */

/**
 * @typedef {{start: PositionEntry; end: PositionEntry; startAt: number; finished: boolean; endAt: number }} PositionTransitionEntry
 */

/**
 * @type {Record<string, { group: any; id: string; type: string; target?: PositionTransitionEntry }>}
 */
export const entityRecord = {};
let entityList = [];

export function removeAllEntities() {
  for (let i = entityList.length - 1; i >= 0; i--) {
    scene.remove(entityList[i]);
  }
  entityList = [];
}

g('addEntityToScene', addEntityToScene);
g('entityRecord', entityRecord);

async function test() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  g("o", await addEntityToScene({
    "type": "spawn",
    "entity": "014738014",
    "player": "p45142944162",
    "name": "Player19",
    "pose": [
      1,
      3,
      2,
      0,
      0,
      0
    ],
  }));
  setPlayerPosition([2, 3, -6, -3, 1]);
  console.log('EntityHandler initialized'); setInterval(update, 40)
  return true;
}

//test().then(r=>(r !== undefined)&&console.log("test() return:", r)).catch(err => { console.log(err); });

export async function addEntityToScene(input) {
  const {
    entity, player, name, pose
  } = input;

  const [x, y, z, yaw, pitch] = pose;
  let group;
  const id = entity.id;
  console.log('Adding entity', id, 'with pose', pose);
  if (!player) {
    console.warn('Unknown entity type or missing player', player);
    return;
  }
  if (entityRecord[id]?.group) {
    entityRecord[id].group.remove();
  }
  entityRecord[id] = {
    id,
    type: 'player',
    group: null,
  };
  group = await PlayerModel.createPlayerMesh(name);
  entityRecord[id].group = group;
  PlayerModel.applyPlayerPose(group, player, x, y, z, yaw, pitch);
  entityList.push(group);
}

export function setEntityTargetPosition(entity, delay, now) {
  const id = entity && typeof entity === 'object' ? (entity.entity || entity.id) : entity;
  if (!entityRecord[id]) {
    console.warn('Entity not found in record:', id);
    return;
  }
  if (typeof entity !== 'object') {
    entity = entityRecord[id];
  }
  if (!entity?.pose) {
    console.warn('Entity without pose:', id);
    return;
  }
  const group = entityRecord[id].group;
  if (!delay) {
    if (entityRecord[id].type === 'player') {
      PlayerModel.applyPlayerPose(group, entity.player, entity.pose[0], entity.pose[1], entity.pose[2], entity.pose[3], entity.pose[4]);
      entityRecord[id].target = null; // Reset target if no delay
    } else {
      group.position.set(entity.pose[0], entity.pose[1], entity.pose[2]);
    }
    return;
  }
  entityRecord[id].target = {
    start: {
      x: group.position.x,
      y: group.position.y,
      z: group.position.z,
      yaw: group.children[0]?.rotation?.y,
      pitch: group.rotation?.z,
    },
    end: {
      x: entity.pose[0],
      y: entity.pose[1],
      z: entity.pose[2],
      yaw: entity.pose[3],
      pitch: entity.pose[4],
    },
    startAt: now,
    endAt: now + delay,
    finished: false,
  }
  return;
}

export function removeEntity(entityId) {
  if (!entityRecord[entityId]) {
    return;
  }
  if (entityRecord[entityId].group) {
    entityRecord[entityId].group.remove();
  }
  delete entityRecord[entityId];
  entityList = entityList.filter(entity => entity.id !== entityId);
}

export function update(time) {
  if (!time) time = new Date().getTime();
  for (const id in entityRecord) {
    if (!entityRecord[id].target || entityRecord[id].target.finished) {
      continue;
    }
    const startPosition = entityRecord[id].target.start;
    const endPosition = entityRecord[id].target.end;
    let t = ib(entityRecord[id].target.startAt, entityRecord[id].target.endAt, time);
    if (t >= 1) {
      entityRecord[id].target.finished = true;
      t = 1;
    }
    // Position
    const x = b(startPosition.x, endPosition.x, t);
    const y = b(startPosition.y, endPosition.y, t);
    const z = b(startPosition.z, endPosition.z, t);
    // Rotation
    if (typeof startPosition.pitch === 'number') {
      const pitch = b(startPosition.pitch, endPosition.pitch, t);
      const yaw = b(startPosition.yaw, endPosition.yaw, t);
      PlayerModel.applyPlayerPose(entityRecord[id].group, null, x, y, z, yaw, pitch);
    } else {
      entityRecord[id].group.position.set(x, y, z);
    }
  }

  // Showcase leg rotation animation
  // const currentTime = Date.now() * 0.002; // Slow down the animation
  // for (const pid in entityRecord) {
  //   const entity = entityRecord[pid];
  //   //console.log(entity);
  //   if (entity.mesh) {
  //     const mesh = entity.mesh;

  //     // Find leg pivot groups
  //     const rightLegPivot = mesh.children.find(child => child.name === 'RightLegPivot');
  //     const leftLegPivot = mesh.children.find(child => child.name === 'LeftLegPivot');

  //     if (rightLegPivot && leftLegPivot) {
  //       // Create walking animation - legs swing back and forth
  //       const legSwingAmount = Math.PI / 6; // 30 degrees max swing

  //       // Right leg rotates forward when left leg rotates back
  //       rightLegPivot.rotation.x = Math.sin(currentTime) * legSwingAmount;
  //       leftLegPivot.rotation.x = Math.sin(currentTime + Math.PI) * legSwingAmount;
  //     }
  //   }
  // }
}