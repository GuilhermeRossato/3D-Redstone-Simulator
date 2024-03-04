import * as THREE from '../libs/three.module.js';
import { scene } from './GraphicsHandler.js';

/**
 * @type {Record<string, { mesh: any; id: string; type: string; }>}
 */
const entityRecord = {};
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
    head.position.set(0, 4/16, 0);
    const bodyGeometry = new THREE.BoxGeometry(1, 12 / 16, 4 / 16);
    // @ts-ignore
    const body = new THREE.Mesh(bodyGeometry, playerMaterial);
    body.name = "Body";
    body.position.set(0, -6/16, 0);

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
    entityRecord[id] = {
        id,
        type,
        mesh,
    };
    entityList.push(mesh);
}

export function updateEntityPosition(entity) {
    if (entity && entityRecord[entity.id]) {
        const mesh = entityRecord[entity.id].mesh;
        mesh.position.set(entity);
        if (entityRecord[entity.id].type === 'player') {
            mesh.children[0].rotation.y = entity.yaw;
            mesh.rotation.z = entity.pitch;
        }
    } else {
        console.warn('Missing entity');
    }
}

export function removeEntity(entityId) {
    delete entityRecord[entityId];
    entityList = entityList.filter(entity => entity.id !== entityId);
}
