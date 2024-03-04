import * as THREE from '../libs/three.module.js';
import { scene } from './GraphicsHandler.js';
import { setPlayerPosition } from './InputHandler.js';
import { updateSelfState } from './Multiplayer/ExternalSelfStateHandler.js';
import * as EntityHandler from './EntityHandler.js';
import * as WorldHandler from './WorldHandler.js';

export let active = false;

const playerEntityRecord = {};

/** @typedef {{
 *   id: number;
 *   name: string;
 *   x: number;
 *   y: number;
 *   z: number;
 *   yaw: number;
 *   pitch: number;
 *   health: number;
 *   maxHealth: number;
 *   type: string;
 * }} EntityObject */

/** @typedef {EntityObject & {
 *   type: 'player';
 * }} PlayerObject */

/** @type {undefined | PlayerObject} */
let player;
/** @type {undefined | WebSocket} */
let socket;

/**
 * @param {PlayerObject} player
 */
function addOtherPlayer(player) {
    if (!player || !player.id) {
        console.warn('Skipping addition of player because of missing id');
        console.log(player);
        return;
    }
    const mesh = EntityHandler.addEntityToScene(player);
    
    playerEntityRecord[player.id] = {
        mesh,
        movement: null,
    }
}

/**
 * @param {EntityObject[]} entityList 
 */
function initEntityList(entityList) {
    EntityHandler.removeAllEntities();
    
    for (const entity of entityList) {
        EntityHandler.addEntityToScene(entity);
    }
}

export async function load() {
    try {
        socket = await performLogin();

        if (!socket) {
            throw new Error('Perform login failed');
        }

        socket.addEventListener('message', (event) => {
            try {
                processServerPacket(
                    JSON.parse(event.data.toString())
                ).catch((err) => {
                    console.warn('Event processing returned an error and could not be processed:', event.data);
                    console.log(err);
                });
            } catch (err) {
                console.warn('Could not process event:', event.data);
                console.log(err);
            }
        });

        active = true;
    } catch (err) {
        active = false;
        console.error('Multiplayer could not be set up:', err);
    }
}

/**
 * @param {{x: number, y: number, z: number, id: number}[]} blockList 
 */
function initWorld(blockList) {
    for (const {x, y, z, id} of blockList) {
        if (id === 0) {
            continue;
        }
        WorldHandler.set(x, y, z, id);
    }
}

async function performLogin() {
    let selfLoginCode = window.localStorage.getItem('self-login-code');
    if (!selfLoginCode) {
        const yearDigit = ((new Date()).getFullYear()).toString()[3];
        const monthPair = ((new Date()).getMonth() + 1).toString().padStart(2, '0');
        const datePair = ((new Date()).getDate()).toString().padStart(2, '0');
        selfLoginCode = monthPair + yearDigit + Math.floor(Math.random() * 8999999 + 1000000).toString() + datePair;
        window.localStorage.setItem('self-login-code', selfLoginCode);
    }
    let cookieId;
    const cookieString = document.cookie;
    if (typeof cookieString === 'string') {
        let cookie = (cookieString.split(';').find(c => c.trim().startsWith('id=')) || '').trim();
        if (cookie) {
            cookieId = cookie.substring(cookie.indexOf('=') + 1);
        }
    }
    const s = new WebSocket("wss://camisadoavesso.com.br:443/websocket/" + selfLoginCode + '/' + (cookieId ? cookieId + '/' : ''));

    s.addEventListener('timeout', () => {
        console.log('socket timeout event');
    }, {
        once: true
    });

    s.addEventListener('close', () => {
        console.log('socket close event');
    }, {
        once: true
    });

    s.addEventListener('error', (err) => {
        console.log('socket error event', err);
    }, {
        once: true
    });

    s.addEventListener("open", () => {
        s.send(JSON.stringify({
            name: 'guest',
            selfLoginCode,
        }));
    }, {
        once: true,
    });

    const login = await new Promise((resolve, reject) => {
        s.addEventListener("message", (event) => {
            try {
                const obj = JSON.parse(event.data);
                resolve(obj);
            } catch (err) {
                s.close();
                reject(new Error('Server sent invalid JSON'));
            }
        }, {
            once: true,
        });
    });

    if (typeof login !== 'object') {
        s.close();
        throw new Error('Server send invalid content');
    }

    if (login.success !== true) {
        s.close();
        throw new Error(`Login was not successful${typeof login.error === 'string' ? `: ${login.error}` : ' (success is false)'}`);
    }

    if (typeof login.storageId === 'string' && login.storageId !== localStorage.getItem('storage-id')) {
        console.log('Updating storageId');
        localStorage.setItem('storage-id', login.storageId.toString());
    }

    if (typeof login.cookieId === 'string' && login.cookieId !== cookieId) {
        console.log('Updating cookieId');
        document.cookie = "id=" + login.cookieId + "; expires=" + new Date(new Date().getTime() + 31_536_000_000).toUTCString();
    }

    if (login.action !== 'syncronize') {
        s.close();
        throw new Error(`Unexpected action after login: ${JSON.stringify(login.action)}`)
    }
    
    const sync = await performSync(s);

    if (sync.action !== 'setup') {
        s.close();
        throw new Error(`Unexpected action after sync: ${JSON.stringify(sync.action)}`)
    }

    /**
     * @type {{action: string, error?: string, state: string, entity: {id: number, x: number, y: number, z: number, yaw: number, pitch: number, health: number, maxHealth: number, name: string, type: 'player'}, blockList: any[], entityList: any[]}}
     */
    const setup = await performSetup(s);

    if (typeof setup.error === 'string') {
        s.close();
        throw new Error(`Setup failed, server error: ${setup.error}`);
    }

    if (setup.action !== 'play') {
        s.close();
        throw new Error(`Unexpected action after setup: ${JSON.stringify(setup.action)}`)
    }

    player = setup.entity;
    setPlayerPosition(setup.entity);
    initEntityList(setup.entityList);
    initWorld(setup.blockList);
    return s;
}

/**
 * @param {WebSocket} socket 
 * @returns {Promise<{clientOffset: number, serverOffset: number, action: string}>}
 */
async function performSync(socket) {
    return await new Promise((resolve, reject) => {
        const offsetList = [];
        let lastClientDate = new Date().getTime();
        const messageHandler = (event) => {
            try {
                const obj = JSON.parse(event.data);
                if (obj.action) {
                    const offset = (offsetList[offsetList.length - 1] + offsetList[offsetList.length - 2]) / 2;
                    socket.removeEventListener('message', messageHandler);
                    if (isNaN(offset)) {
                        reject(new Error('Offset is not a number'));
                        return;
                    }
                    const serverOffset = obj.offset;
                    resolve({
                        clientOffset: offset,
                        serverOffset,
                        action: obj.action
                    })
                    return;
                }
                const clientDate = new Date().getTime();
                const ping = lastClientDate ? clientDate - lastClientDate : null;
                lastClientDate = clientDate;
                const currentServerDate = obj.serverDate + (ping !== null ? ping / 2 : 0);
                const offset = clientDate - currentServerDate;

                if (Math.abs(obj.offset + offset) > 4) {
                    console.warn('The server and client offset differ by', Math.abs(obj.offset + offset), 'server:', obj.offset, 'client:', offset);
                }
                
                offsetList.push(offset);
                socket.send(JSON.stringify({
                    clientDate: new Date().getTime(),
                    ping,
                    offset
                }));
            } catch (err) {
                socket.removeEventListener('message', messageHandler);
                reject(err);
            }
        };
        socket.addEventListener('message', messageHandler);
        socket.send(JSON.stringify({
            clientDate: new Date().getTime(),
        }));
    });
}

/**
 * @param {WebSocket} socket 
 * @returns {Promise<any>}
 */
async function performSetup(socket) {
    return await new Promise((resolve, reject) => {
        socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data.toString());
                resolve(data);
            } catch (err) {
                reject(err);
            }
        }, {
            once: true,
        });
        socket.send(JSON.stringify({state: 'setup'}));
    });
}

function b(i, j, t) {
    if (typeof i !== 'number' || typeof j !== 'number' || isNaN(i) || isNaN(j) || isNaN(t)) {
        throw new Error('Got NaN: ' + JSON.stringify([i, j, t]));
    }
    return i + (j - i) * t;
}

export function sendAction(action) {
    if (!active || !socket) {
        return;
    }
    if (action.type === 'move') {
        action.x = parseFloat(action.x.toFixed(3));
        action.y = parseFloat(action.y.toFixed(3));
        action.z = parseFloat(action.z.toFixed(3));
        action.yaw = parseFloat(action.yaw.toFixed(3));
        action.pitch = parseFloat(action.pitch.toFixed(3));
    }
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(action));
    } else {
        const lastRefresh = window.localStorage.getItem('last-refresh-for-broken-socket');
        let shouldRefresh = true;
        const now = new Date();
        if (lastRefresh) {
            const date = new Date(lastRefresh);
            if (isNaN(date.getTime()) || now.getTime() - date.getTime() < 10000) {
                shouldRefresh = false;
            }
        }
        if (shouldRefresh) {
            window.localStorage.setItem('last-refresh-for-broken-socket', now.toISOString());
            window.location.reload();
        }
    }
}

export function update() {
    for (const pid in playerEntityRecord) {
        if (!playerEntityRecord[pid].target || playerEntityRecord[pid].target.finished) {
            continue;
        }
        const originPosition = playerEntityRecord[pid].target.origin;
        const targetPosition = playerEntityRecord[pid].target.target;
        const n = new Date().getTime();
        if (playerEntityRecord[pid].target.end < n) {
            playerEntityRecord[pid].target.finished = true;
            playerEntityRecord[pid].group.position.set(targetPosition[0], targetPosition[1], targetPosition[2]);
            playerEntityRecord[pid].group.rotation.set(0, targetPosition[4], 0);
        } else {
            const t = (n - playerEntityRecord[pid].target.start) / (playerEntityRecord[pid].target.end - playerEntityRecord[pid].target.start);
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
            playerEntityRecord[pid].group.position.set(x, y, z);
            playerEntityRecord[pid].group.rotation.set(0, pitch, 0);
        }
    }
    if (active && player) {
        updateSelfState();
    }
}

async function processServerPacket(packet) {
    if (packet.event === 'entity-spawn') {
        if (packet.entity.type === 'player') {
            addOtherPlayer(packet.entity);
        } else {
            console.log('Got unexpected entity type "' + packet.entity.type + '"');
        }
        return;
    } else if (packet.event === 'move' && packet.entity.id && packet.entity.id !== player.id) {
        if (!playerEntityRecord[packet.entity.id]) {
            return {
                type: 'request-entity',
                id: packet.entity.id
            }
        } else {
            EntityHandler.updateEntityPosition(packet.entity);
        }
        return;
    } else if (packet.event === 'entity-despawn') {
        if (!playerEntityRecord[packet.entity.id]) {
            return;
        }
        EntityHandler.removeEntity(packet.entity.id);
        delete playerEntityRecord[packet.entity.id];
        return;
    } else if (packet.event === 'block') {
        if (
            typeof packet.x === 'number' &&
            typeof packet.y === 'number' &&
            typeof packet.z === 'number' &&
            typeof packet.id === 'number'
        ) {
            WorldHandler.set(packet.x, packet.y, packet.z, packet.id);
        }
    } else if (Object.keys(packet).length === 1 && packet.success === true) {
        // Ignore success
    } else {
        console.warn('Unknown packet', packet);
    }
}
