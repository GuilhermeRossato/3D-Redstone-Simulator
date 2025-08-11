import * as THREE from '../libs/three.module.js';
import * as PlayerModel from '../models/PlayerModel.js';
import { b, ib, bv, thirdDegreeBezierVector } from '../utils/bezier.js';
import { g } from '../utils/g.js';
import { scene } from './GraphicsHandler.js';
import { setPlayerPosition } from './InputHandler.js';

/**
 * @typedef {{x: number, y: number, z: number; yaw?: number; pitch?: number}} PositionEntry
 */

/**
 * @typedef {{start: PositionEntry; end: PositionEntry; startAt: number; finished: boolean; endAt: number; delay: number }} PositionTransitionEntry
 */

/**
 * @type {Record<string, { punching?: any; group: any; id: string; type: string; target?: PositionTransitionEntry, pose: number[], player?: string, name?: string }>}
 */
export const entityRecord = {};
let entityList = [];

export function removeAllEntities() {
  for (let i = entityList.length - 1; i >= 0; i--) {
    scene.remove(entityList[i]);
  }
  entityList = [];
}

export function activatePunchAnimation(entityId, target) {
  if (!entityRecord[entityId]) {
    console.warn('Entity not found in record:', entityId);
    return;
  }
  const entity = entityRecord[entityId];
  if (entity.type !== 'player') {
    console.warn('Punch animation can only be activated for players:', entityId);
    return;
  }
  console.log(`Punch animation activated for entity ${entityId}`);
  entity.punching = true;
}

g('addEntityToScene', addEntityToScene);
g('entityRecord', entityRecord);

async function test() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const group = await addEntityToScene({
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
  });
  g("o", group);
  //setPlayerPosition([2, 3, -6, -3, 1]);
  window['px'] = 0;
  window['py'] = 0;
  window['pz'] = 0;
  window['pyaw'] = 0;
  window['ppitch'] = 0;
  let cou = 0;
  console.log('EntityHandler initialized');
  setInterval(() => {
    cou += 2;
    const y = (((cou < 100 ? cou : 200 - cou) / 100) * Math.PI);
    if ((cou / 2) % 8 == 0) {
      console.log({ y, cou, bc: 200 - cou });
    }
    window["applyPlayerPose"](group, "", window['px'], window['py'], window['pz'], y, window['ppitch']);
    if (cou > 200) cou = 0;
  }, 100)
  return true;
}

//test().then(r => (r !== undefined) && console.log("test() return:", r)).catch(err => { console.log(err); });

export async function addEntityToScene(input) {
  const {
    id, player, name, pose
  } = input;

  const [x, y, z, yaw, pitch] = pose;
  let group;
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
    pose,
    player,
    group: null,
  };
  group = await PlayerModel.createPlayerMesh(name);
  entityRecord[id].group = group;
  PlayerModel.applyPlayerPose(group, player, x, y, z, yaw, pitch);
  entityList.push(group);
  return group;
}

export function setEntityTargetPosition(entity, delay) {
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
    delay,
    startAt: 0,
    endAt: 0,
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

export function update(frame) {
  if (!frame) frame = (new Date().getTime()/16)|0;
  for (const id in entityRecord) {
    if (entityRecord[id].punching === true) {
      entityRecord[id].punching = frame;
      continue;
    }
    if (entityRecord[id].group && typeof entityRecord[id].punching === "number") {
      const element = entityRecord[id].group.children[2];
      const t = Math.min(1, ((frame - entityRecord[id].punching) * 16) / 2000);

      const vec = [
        [0, 0, 0],
        [-0.2, -0.2, -0.8],
        [-0.2, 0.9, -1],
        [-0.0, 1.3, -0.7],
      ];
      const varr = t < 0.33 ? vec.slice(0, 2) : t < 0.66 ? vec.slice(1, 3) :vec.slice(2, 4);

      element.rotation.set(
        b(varr[0][0], varr[1][0], t),
        b(varr[0][1], varr[1][1], t),
        b(varr[0][2], varr[1][2], t),
      );

      if (t >= 1) {
        delete entityRecord[id].punching;
      }
      continue;
    }
    if (entityRecord[id].group) {
      const m = Math.cos(2*Math.PI*((frame % 180)/180));
      entityRecord[id].group.children[2].rotation.set(m*0.02, 0, (-1)*(0.06+ m*0.09));
      entityRecord[id].group.children[3].rotation.set(m*0.02, 0, (1)*(0.06+ m*0.09));
    }
    if (!entityRecord[id].target || entityRecord[id].target.finished) {
      continue;
    }
    const startPosition = entityRecord[id].target.start;
    const endPosition = entityRecord[id].target.end;
    if (!entityRecord[id].target.startAt) {
      entityRecord[id].target.startAt = frame;
      entityRecord[id].target.endAt = frame + entityRecord[id].target.delay;
    }
    const t = frame > entityRecord[id].target.endAt ? 1 : (frame - entityRecord[id].target.endAt) / (entityRecord[id].target.startAt - entityRecord[id].target.endAt);
    if (t >= 1) {
      entityRecord[id].target.finished = true;
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