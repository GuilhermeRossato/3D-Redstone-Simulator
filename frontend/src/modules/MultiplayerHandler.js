import * as THREE from '../libs/three.module.js';
import { clearDirtyness, dirty, position, rotation } from './InputHandler.js';

let scene;

const playerMaterial = new THREE.MeshLambertMaterial();

export let active = false;

const onlinePlayerRecord = {};

/**
 * @param {{_id: string, username: string, name: string, x: number, y: number, z: number, pitch: number, yaw: number, type: string, lastMoveTime: number, self: boolean}[]} playerList 
 */
function initPlayers(playerList, pitchObject, yawObject) {
    for (let player of playerList) {
        if (pitchObject && yawObject && player.self) {
            yawObject.position.set(player.x, player.y, player.z);
            pitchObject.rotation.set(0, player.pitch, 0);
            continue;
        }
        const playerGroup = new THREE.Group();
        playerGroup.name = player.name || player.username;
        const headSize = 8;
        const headGeometry = new THREE.BoxGeometry(headSize / 16, headSize / 16, headSize / 16);
        // @ts-ignore
        const head = new THREE.Mesh(headGeometry, playerMaterial);
        head.position.set(0, 4/16, 0);
        const bodyGeometry = new THREE.BoxGeometry(1, 12 / 16, 4 / 16);
        // @ts-ignore
        const body = new THREE.Mesh(bodyGeometry, playerMaterial);
        body.position.set(0, -6/16, 0);

        const legGeometry = new THREE.BoxGeometry(8 / 16, 12 / 16, 4 / 16);
        // @ts-ignore
        const leg = new THREE.Mesh(legGeometry, playerMaterial);
        leg.position.set(0, - 18 / 16, 0);

        playerGroup.position.set(player.x, player.y, player.z);
        head.rotation.y = player.yaw;
        playerGroup.add(head);
        playerGroup.add(body);
        playerGroup.add(leg);
        scene.add(playerGroup);

        onlinePlayerRecord[player.name] = {
            group: playerGroup,
        }
    }
}

/**
 * @param {THREE.Scene} externalScene
 * @param {THREE.Object3D} pitchObject
 * @param {THREE.Object3D} yawObject
 */
export async function load(externalScene, pitchObject, yawObject) {
    scene = externalScene;
    if (await validateSession()) {
        active = true;
        const response = await fetch('/request-nearby-players/');
        const userList = await response.json();
        console.log(userList);
        if (userList.error) {
            console.error(userList.error);
        } else if (userList instanceof Array) {
            initPlayers( userList, pitchObject, yawObject);
        } else {
            console.error('User list not a valid array');
        }
    }
}

async function validateSession() {
    const response = await fetch('/validate-session/');
    const json = await response.json();
    if (typeof json !== 'boolean') {
        if (typeof json === 'object' && typeof json.error === 'string') {
            throw new Error(json.error);
        }
        if (typeof json === 'object' && typeof json.message === 'string') {
            throw new Error(json.message);
        }
    }
    return (json === true);
}

let sendingPosition = false;

async function sendCurrentPositionToServer() {
    const body = JSON.stringify([{
        type: 'move',
        x: position.x,
        y: position.y,
        z: position.z,
        yaw: rotation.yaw,
        pitch: rotation.pitch,
    }]);

    clearDirtyness();

    const response = await fetch('/player-made-action/', { method: 'POST', body });

    const text = await response.text();

    if (text.length === 0) {
        return;
    }

    if (text[0] === '<') {
        console.error('Player made action returned HTML');
        return;
    }

    console.error('Player action returned unexpected data', text);
}

let requestingNextEvent = false;

async function requestNextEvent() {
    const response = await fetch('/request-next-game-state/');
    const text = await response.text();
    if (text.length === 0) {
        throw new Error('Request next game state returned empty string and status ' + response.status);
    }
    if (text[0] !== '[') {
        throw new Error(text);
    }
    const list = JSON.parse(text);
    for (let event of list) {
        if (event.type === 'move') {
            if (!onlinePlayerRecord[event.player]) {
                // new player
                initPlayers([event], null, null);
            } else {
                onlinePlayerRecord[event.player].group.position.set(event.x, event.y, event.z);
                onlinePlayerRecord[event.player].group.rotation.set(0, event.pitch, 0);
            }
        } else if (event.type === 'logout') {
            if (!onlinePlayerRecord[event.player]) {
                return;
            }
            scene.remove(onlinePlayerRecord[event.player].group);
            delete onlinePlayerRecord[event.player];
        }

    }
}

let sendPositionToServer = 0;

export async function update(frame) {
    if (sendPositionToServer < 20) {
        sendPositionToServer += frame;
    } else {
        if (!sendingPosition && dirty) {
            sendPositionToServer -= 20;
            sendingPosition = true;
            sendCurrentPositionToServer().then(
                () => sendingPosition = false
            );
        }
    }
    if (requestingNextEvent === false) {
        requestingNextEvent = true;
        requestNextEvent().then(
            () => requestingNextEvent = false
        );
    }
}
