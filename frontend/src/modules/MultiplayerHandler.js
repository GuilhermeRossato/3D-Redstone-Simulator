import * as THREE from '../libs/three.module.js';
import { scene } from './GraphicsHandler.js';
import { setPlayerPosition } from './InputHandler.js';
import { updateSelfState } from './Multiplayer/ExternalSelfStateHandler.js';
import { updateExternalWorld } from './Multiplayer/ExternalWorldHandler.js';
import { updateNextGameState } from './Multiplayer/NextGameStateHandler.js';
import { set } from './WorldHandler.js';

export let active = false;

const playerMaterial = new THREE.MeshLambertMaterial();

const onlinePlayerRecord = {};

/** @typedef {{
 *   _id: string;
 *   name: string;
 *   x: number;
 *   y: number;
 *   z: number;
 *   yaw: number;
 *   pitch: number;
 * }} PlayerObject */

/** @type {undefined | PlayerObject} */
let player;

/**
 * @param {PlayerObject} player
 */
function addOtherPlayer(player) {
    if (!player || !player._id) {
        console.warn('Skipping addition of player because of missing id');
        console.log(player);
        return;
    }
    const playerGroup = new THREE.Group();
    playerGroup.name = player.name;
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

    onlinePlayerRecord[player._id] = {
        group: playerGroup,
    }
}

/**
 * @param {PlayerObject[]} playerList 
 */
function initPlayers(playerList) {
    // Remove previous users
    for (let playerId in onlinePlayerRecord) {
        // Skip self
        if (player && player._id === playerId) {
            continue;
        }
        // 
        if (!playerList.find(player => player._id === playerId)) {
            continue;
        }
    }

    // Create all users
    for (let otherPlayer of playerList) {
        // Skip self from creation
        if (otherPlayer._id === player._id) {
            continue;
        }
        addOtherPlayer(otherPlayer);
    }
}

export async function load() {
    try {
        const response = await performLogin();

        if (!response) {
            console.warn('Login did not return data');
            return;
        }

        if (response.message || response.error) {
            console.warn('Login failed with error', response.message || response.error);
            return;
        }

        if (!response.player || typeof response.player.x !== 'number' || typeof response.player.y !== 'number' || typeof response.player.z !== 'number') {
            console.warn('Server did not send a correct player object at response', response);
            return;
        }

        if (response && response.success) {
            active = true;
            player = response.player;
            setPlayerPosition(player.x, player.y, player.z, player.yaw, player.pitch);
            initPlayers(response.players);
            initWorld(response.world);
        } else {
            console.log('Missing success flag from server response');
        }
    } catch (err) {
        active = false;
        console.error(err);
    }
}

/**
 * 
 * @param {{x: number, y: number, z: number, id: number}[]} blockList 
 */
function initWorld(blockList) {
    for (const {x, y, z, id} of blockList) {
        if (x === -4 && y === 0 && z === 0) {
            console.trace(x, y, z, id);
        }
        if (id === 0) {
            continue;
        }
        set(x, y, z, id);
    }
}

async function performLogin() {
    let selfLoginCode1 = window.localStorage.getItem('self-login-code');
    let selfLoginCode2 = window.sessionStorage.getItem('self-login-code');
    const monthPair = ((new Date()).getMonth() + 1).toString().padStart(2, '0');
    const datePair = ((new Date()).getDate()).toString().padStart(2, '0');
    if (!selfLoginCode1) {
        selfLoginCode1 = monthPair + Math.floor(Math.random() * 8999999 + 1000000).toString() + datePair;
        window.localStorage.setItem('self-login-code', selfLoginCode1);
    }
    if (!selfLoginCode2) {
        selfLoginCode2 = monthPair + Math.floor(Math.random() * 899999 + 100000).toString() + datePair;
        window.sessionStorage.setItem('self-login-code', selfLoginCode2);
    }
    const response = await fetch('/perform-client-login/', {
        method: 'POST',
        headers: {
            'self-login-code': selfLoginCode1 + '-' + selfLoginCode2,
        },
    });
    const text = await response.text();
    if (!text) {
        throw new Error('Server did not send data');
    }
    if (text[0] !== '{') {
        if (text[0] === '<' || text.length > 1000) {
            throw new Error('Perform login returned invalid text');
        } else {
            throw new Error(text);
        }
    }
    const json = JSON.parse(text);
    return json;
}

function b(i, j, t) {
    if (typeof i !== 'number' || typeof j !== 'number' || isNaN(i) || isNaN(j) || isNaN(t)) {
        throw new Error('Got NaN: ' + JSON.stringify([i, j, t]));
    }
    return i + (j - i) * t;
}

export function update() {
    for (const pid in onlinePlayerRecord) {
        if (!onlinePlayerRecord[pid].target || onlinePlayerRecord[pid].target.finished) {
            continue;
        }
        const originPosition = onlinePlayerRecord[pid].target.origin;
        const targetPosition = onlinePlayerRecord[pid].target.target;
        const n = new Date().getTime();
        if (onlinePlayerRecord[pid].target.end < n) {
            onlinePlayerRecord[pid].target.finished = true;
            onlinePlayerRecord[pid].group.position.set(targetPosition[0], targetPosition[1], targetPosition[2]);
            onlinePlayerRecord[pid].group.rotation.set(0, targetPosition[4], 0);
        } else {
            const t = (n - onlinePlayerRecord[pid].target.start) / (onlinePlayerRecord[pid].target.end - onlinePlayerRecord[pid].target.start);
            if (isNaN(t)) {
                console.log('t is NaN');
                continue;
            }
            const x = b(originPosition[0], targetPosition[0], t);
            const y = b(originPosition[1], targetPosition[1], t);
            const z = b(originPosition[2], targetPosition[2], t);
            const pitch = b(originPosition[4], targetPosition[4], t);
            if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(pitch)) {
                continue;
            }
            onlinePlayerRecord[pid].group.position.set(x, y, z);
            onlinePlayerRecord[pid].group.rotation.set(0, pitch, 0);
        }
    }
    if (active && player) {
        updateSelfState();
        updateNextGameState();
    }
}

export function processEvent(event) {
    if (!event.pid) {
        console.warn('Skipping event of type', event.type, 'because of missing player id (pid)');
        return;
    }
    if (event.type === 'player-spawn') {
        // Spawn the new player
        console.log('Player spawned');
        addOtherPlayer(event.properties);
    } else if (event.type === 'move') {
        if (player && event.pid === player._id) {
            console.warn('Server sent self movement event (ignoring it)');
            return;
        }
        console.log('Player moved');
        if (!onlinePlayerRecord[event.pid]) {
            onlinePlayerRecord[event.pid] = new Promise((resolve) => {
                fetch('/get-player-info/' + event.pid).then(
                    r => r.json()
                ).then(result => {
                    if (!result || result.message || result.error) {
                        console.log(result);
                        console.warn('Failed while getting player id ' + event.pid + ' info:', result.message);
                        resolve();
                        return;
                    }
                    if (!result.id || result.id !== event.pid) {
                        console.log(result);
                        console.warn('Failed while getting player id ' + event.pid + ' info: Missing or unexpected player id on result');
                        resolve();
                        return;
                    }
                    if (!(onlinePlayerRecord[event.pid] instanceof Promise)) {
                        // User must have logged off while loading him
                        resolve();
                        return;
                    }
                    processEvent({
                        type: 'player-spawn',
                        pid: event.pid,
                        player: result,
                    });
                    resolve();
                }).catch(err => {
                    console.warn('Failed while getting player id ' + event.pid + ' info:');
                    console.error(err);
                    resolve();
                });
            });
        } else if (onlinePlayerRecord instanceof Promise) {
            // Ignore player movement as he does not exist yet
        } else {
            // console.log(event.pid, 'Moved to', event.x, event.y, event.z, event.pitch, event.yaw);
            if (!onlinePlayerRecord[event.pid].group) {
                console.warn('Skipped because of missing group on online player record', onlinePlayerRecord[event.pid]);
                return;
            }
            if (isNaN(event.x) || isNaN(event.y) || isNaN(event.z) || isNaN(event.pitch) || isNaN(event.yaw)) {
                console.warn('Skipped because of NaN position on event', event);
                return;
            }
            const start = new Date().getTime();
            onlinePlayerRecord[event.pid].target = {
                finished: false,
                start,
                end: start + 500,
                origin: [onlinePlayerRecord[event.pid].group.position.x, onlinePlayerRecord[event.pid].group.position.y, onlinePlayerRecord[event.pid].group.position.z, 0, onlinePlayerRecord[event.pid].group.rotation.y],
                target: [event.x, event.y, event.z, event.pitch, event.yaw]
            }
            // onlinePlayerRecord[event.pid].group.position.set(event.x, event.y, event.z);
            // onlinePlayerRecord[event.pid].group.rotation.set(0, event.pitch, 0);
        }
    } else if (event.type === 'player-despawn') {
        if (!onlinePlayerRecord[event.pid]) {
            // user already does not exist 
            return;
        }
        if (onlinePlayerRecord[event.pid] instanceof Promise) {
            onlinePlayerRecord[event.pid].then(() => {
                if (onlinePlayerRecord[event.pid]) {
                    scene.remove(onlinePlayerRecord[event.pid].group);
                    delete onlinePlayerRecord[event.pid];
                }
            });
            delete onlinePlayerRecord[event.pid];
        } else {
            scene.remove(onlinePlayerRecord[event.pid].group);
            delete onlinePlayerRecord[event.pid];
        }
    } else if (event.type === 'set-block') {
        if (typeof event.x === 'number' && typeof event.y === 'number' && typeof event.z === 'number' && typeof event.id === 'number') {
            set(event.x, event.y, event.z, event.id);
        }
    } else {
        console.warn('Unknown server event of type "' + (event ? event.type : 'unknown') + '"');
    }
}
