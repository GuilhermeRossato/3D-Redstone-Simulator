import * as THREE from '../libs/three.module.js';
import { b, ib } from '../utils/bezier.js';
import { scene } from './GraphicsHandler.js';

/**
 * @typedef {{x: number, y: number, z: number; yaw?: number; pitch?: number}} PositionEntry
 */

/**
 * @typedef {{start: PositionEntry; end: PositionEntry; startAt: number; finished: boolean; endAt: number }} PositionTransitionEntry
 */

/**
 * @type {Record<string, { group: any; mesh: any; id: string; type: string; target?: PositionTransitionEntry }>}
 */
export const entityRecord = {};
let entityList = [];

const playerMaterial = new THREE.MeshLambertMaterial();

function createPlayerMesh(name) {
    const group = new THREE.Group();
    group.name = name;
    const headSize = 8;
    const headGeometry = new THREE.BoxGeometry(headSize / 16, headSize / 16, headSize / 16);
    // @ts-ignore
    const head = new THREE.Mesh(headGeometry, playerMaterial);
    head.name = "Head";
    head.position.set(0, 4 / 16, 0);
    const bodyGeometry = new THREE.BoxGeometry(1, 12 / 16, 4 / 16);
    // @ts-ignore
    const body = new THREE.Mesh(bodyGeometry, playerMaterial);
    body.name = "Body";
    body.position.set(0, -6 / 16, 0);

    const legGeometry = new THREE.BoxGeometry(8 / 16, 12 / 16, 4 / 16);
    // @ts-ignore
    const leg = new THREE.Mesh(legGeometry, playerMaterial);
    leg.position.set(0, - 18 / 16, 0);

    group.add(head);
    group.add(body);
    group.add(leg);
    scene.add(group);
    return group;
}

export function removeAllEntities() {
    for (let i = entityList.length - 1; i >= 0; i--) {
        scene.remove(entityList[i]);
    }
    entityList = [];
}

export function addEntityToScene(input) {
  const {
    entity, player, name, pose
  } = input;

  const [x, y, z, yaw, pitch] = pose;
  let mesh;
  console.log('Adding entity', entity, 'with pose', pose);
  if (player) {
    mesh = createPlayerMesh(name);
    mesh.position.set(x, y, z);
    mesh.rotation.set(0, yaw, 0);
    mesh.children[0].rotation.y = pitch;
  } else {
    console.warn('Unknown entity type or missing player', player);
    return;
  }

  if (entityRecord[entity]?.mesh) {
    entityRecord[entity].mesh.remove();
  }

  entityRecord[entity] = {
    id: entity,
    type: 'player',
    mesh,
    group: null,
  };

  entityList.push(mesh);
}

export function setEntityTargetPosition(entity, delay, now) {
    const id = entity.entity;
  const mesh = entityRecord[id].mesh;
    if (!delay) {
        mesh.position.set(entity.pose[0], entity.pose[1], entity.pose[2]);
        if (entityRecord[id].type === 'player') {
            mesh.children[0].rotation.y = entity.pose[3];
            mesh.rotation.z = entity.pose[4];
        }
        return;
    }
    entityRecord[id].target = {
        start: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            yaw: mesh.children[0]?.rotation?.y,
            pitch: mesh.rotation?.z,
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
    if (entityRecord[entityId].mesh) {
        entityRecord[entityId].mesh.remove();
    }
    delete entityRecord[entityId];
    entityList = entityList.filter(entity => entity.id !== entityId);
}

export function update(time) {
    for (const pid in entityRecord) {
        if (!entityRecord[pid].target || entityRecord[pid].target.finished) {
            continue;
        }
        const startPosition = entityRecord[pid].target.start;
        const endPosition = entityRecord[pid].target.end;
        const n = new Date().getTime();
        let t = ib(entityRecord[pid].target.startAt, entityRecord[pid].target.endAt, n);
        if (t >= 1) {
            entityRecord[pid].target.finished = true;
            t = 1;
        }
        // Position
        const x = b(startPosition.x, endPosition.x, t);
        const y = b(startPosition.y, endPosition.y, t);
        const z = b(startPosition.z, endPosition.z, t);
      const mesh = entityRecord[pid].mesh;
      mesh.position.set(x, y, z);
        
        // Rotation
        if (typeof startPosition.pitch === 'number') {
            const pitch = b(startPosition.pitch, endPosition.pitch, t);
            const yaw = b(startPosition.yaw, endPosition.yaw, t);
 
            mesh.rotation.set(0, yaw, 0);
            mesh.children[0].rotation.y = pitch;
            entityRecord[pid].group.rotation.set(0, pitch, 0);
        }
    }
}