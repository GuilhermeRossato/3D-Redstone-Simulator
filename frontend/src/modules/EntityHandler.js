import * as THREE from '../libs/three.module.js';
import { scene } from './GraphicsHandler.js';

/**
 * @typedef {{x: number, y: number, z: number; yaw?: number; pitch?: number}} PositionEntry
 */

/**
 * @typedef {{start: PositionEntry; end: PositionEntry; startAt: number; finished: boolean; endAt: number }} PositionTransitionEntry
 */

/**
 * @type {Record<string, { mesh: any; id: string; type: string; target?: PositionTransitionEntry }>}
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

export function addEntityToScene(entity) {
    const {
        id, type, name,
        x, y, z,
        yaw, pitch,
    } = entity;
    let mesh;
    if (type === 'player') {
        mesh = createPlayerMesh(name);
        mesh.position.set(x, y, z);
        mesh.children[0].rotation.y = yaw;
        mesh.rotation.z = pitch;
    } else {
        console.warn('Unknown entity type', type);
        return;
    }
    if (entityRecord[id]?.mesh) {
        entityRecord[id].mesh.remove();;
    }
    entityRecord[id] = {
        id,
        type,
        mesh,
    };
    entityList.push(mesh);
}

export function setEntityTargetPosition(entity, delay, now) {
    const mesh = entityRecord[entity.id].mesh;
    if (!delay) {
        mesh.position.set(entity);
        if (entityRecord[entity.id].type === 'player') {
            mesh.children[0].rotation.y = entity.yaw;
            mesh.rotation.z = entity.pitch;
        }
        return;
    }
    entityRecord[entity.id].target = {
        start: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            yaw: mesh.children[0]?.rotation?.y,
            pitch: mesh.rotation?.z,
        },
        end: {
            x: entity.x,
            y: entity.y,
            z: entity.z,
            yaw: entity.yaw,
            pitch: entity.pitch,
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
        const duration = entityRecord[pid].target.time + entityRecord[pid].target.;
        if (entityRecord[pid].target.time +) {
            entityRecord[pid].target.finished = true;
            entityRecord[pid].group.position.set(endPosition[0], endPosition[1], endPosition[2]);
            entityRecord[pid].group.rotation.set(0, endPosition[4], 0);
        } else {
            const t = (n - entityRecord[pid].target.start) / (entityRecord[pid].target.end - entityRecord[pid].target.start);
            if (isNaN(t)) {
                console.log('t is NaN');
                continue;
            }
            const x = b(startPosition[0], endPosition[0], t);
            const y = b(startPosition[1], endPosition[1], t);
            const z = b(startPosition[2], endPosition[2], t);
            const pitch = b(startPosition[4], endPosition[4], t);
            if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(pitch)) {
                continue;
            }
            entityRecord[pid].group.position.set(x, y, z);
            entityRecord[pid].group.rotation.set(0, pitch, 0);
        }
    }
}