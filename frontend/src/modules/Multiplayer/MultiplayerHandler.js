import * as THREE from '../../libs/three.module.js';
import { scene } from '../GraphicsHandler.js';
import { setPlayerPosition } from '../InputHandler.js';
import { updateSelfState } from './ExternalSelfStateHandler.js';
import * as EntityHandler from '../EntityHandler.js';
import * as WorldHandler from '../WorldHandler.js';
import { initializeSocket, sendEvent } from './SocketHandler.js';
import { b } from '../../utils/bezier.js';

export let active = false;

const playerEntityRecord = {};

/** @typedef {{
 *   id: number;
 *   name: string;
 *   x: number;
 *   y: number;
 *   z: number;
 *   type: string;
 *   props: Record<string, string>
 *   health: number;
 *   maxHealth: number;
 * }} EntityObject */

/** @typedef {EntityObject & {
 *   type: 'player';
 *   props: {
 *    yaw: number;
 *    pitch: number;
 *  }
 * }} PlayerObject */

/** @type {undefined | PlayerObject} */
let player;

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


export async function load() {
    try {      
        await initializeSocket();
        await performLogin();
        active = true;
    } catch (err) {
        active = false;
        console.error('Multiplayer failed to start:', err);
    }
    return active;
}

/**
 * @param {{x: number, y: number, z: number, id: number}[]} blockList
 */
function initWorld(blockList) {
    for (const { x, y, z, id } of blockList) {
        if (id === 0) {
            continue;
        }
        WorldHandler.set(x, y, z, id);
    }
}

export async function getSelfLoginCode() {
    let selfLoginCode = window.localStorage.getItem('self-login-code');
    if (!selfLoginCode) {
        const yearDigit = ((new Date()).getFullYear()).toString()[3];
        const monthPair = ((new Date()).getMonth() + 1).toString().padStart(2, '0');
        const datePair = ((new Date()).getDate()).toString().padStart(2, '0');
        selfLoginCode = monthPair + yearDigit + Math.floor(Math.random() * 8999999 + 1000000).toString() + datePair;
        window.localStorage.setItem('self-login-code', selfLoginCode);
    }
    return selfLoginCode;
}

export async function getCookieId() {
    const cookieString = document.cookie;
    if (typeof cookieString === 'string') {
        const cookie = (cookieString.split(';').find(c => c.trim().startsWith('id=')) || '').trim();
        if (cookie) {
            return cookie.substring(cookie.indexOf('=') + 1);
        }
    }
    return '';
}

async function performLogin() {
    const cookieId = await getCookieId();
    const initResponse = await sendEvent({
        type: 'setup',
        selfLoginCode: await getSelfLoginCode(),
        cookieId: cookieId,
    }, true);
    if (initResponse?.success !== true) {
        console.log('Invalid server object:', initResponse);
        throw new Error('Server did not return success on connection setup packet');
    }
    if (typeof initResponse?.time !== 'number') {
        throw new Error('Server did not return current time on connection setup packet');
    }
    // Update cookie id
    if (typeof initResponse.cookieId === 'string' && initResponse.cookieId !== cookieId) {
        console.log('Updating cookieId');
        document.cookie = `id=${initResponse.cookieId}; expires=${new Date(new Date().getTime() + 31_536_000_000).toUTCString()}`;
    }
    // Update player position
    if (typeof initResponse.x === 'number' && typeof initResponse.y === 'number' && typeof initResponse.z === 'number') {
        setPlayerPosition(initResponse);
    }
    // Update world in parts
    const blockStepSize = initResponse.blockList instanceof Array ? Math.min(100, Math.ceil(initResponse.blockList.length / 6)) : 0;
    const entityStepSize = initResponse.entityList instanceof Array ? Math.min(100, Math.ceil(initResponse.entityList.length / 6)) : 0;
    if (initResponse.entityList instanceof Array) {
        EntityHandler.removeAllEntities();
    }
    let blockIndex = 0;
    let entityIndex = 0;
    // Perform server time syncronization
    const datePairList = [];
    let lastSentTime;
    for (let i = 0; i < 6; i++) {
        lastSentTime = new Date().getTime();
        const response = await sendEvent({
            type: 'sync',
            clientTime: lastSentTime
        }, true);
        if (typeof response.serverTime !== 'number' || Math.abs(response.serverTime - lastSentTime) > 120_000) {
            throw new Error('Server did not sent time or the client date does not match the server date');
        }
        datePairList.push([lastSentTime, response.serverTime]);
        // Populate partial area if present
        for (let j = 0; initResponse.blockList instanceof Array && j < blockStepSize && blockIndex < initResponse.blockList.length; j++) {
            const { x, y, z, id } = initResponse.blockList[blockIndex];
            WorldHandler.set(x, y, z, id);
            blockIndex++;
        }
        // Populate partial entities if present 
        for (let j = 0; initResponse.entityList instanceof Array && j < entityStepSize && entityIndex < initResponse.entityList.length; j++) {
            const entity = initResponse.entityList[entityIndex];
            entityIndex++;
            try {
                EntityHandler.addEntityToScene(entity);
            } catch (err) {
                err.message = `Could not add entity to client: ${err.message}with data ${JSON.stringify(entity)}`;
                throw err;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    const differenceList = datePairList.slice(datePairList.length - 3).map(pair => pair[0] - pair[1]);
    if (differenceList.length === 0 || differenceList.some(d => isNaN(d))) {
        throw new Error('Failed to retrieve valid time difference list on server syncronization');
    }
    const offset = differenceList.reduce((p, c) => p + c, 0) / differenceList.length;

    console.log(differenceList.map(a => new Date(a).toISOString().substring(15)), offset);

    const startResponse = await sendEvent({
        type: 'context',
        offset,
        since: initResponse.time,
    });

    if (startResponse?.success !== true || typeof startResponse.entity !== 'object') {
        console.log('Invalid server object:', startResponse);
        throw new Error('First context request did not return current player entity data');
    }

    player = startResponse.entity;

    // Update player position
    if (typeof player.x === 'number' && typeof player.y === 'number' && typeof player.z === 'number') {
        setPlayerPosition(player);
    }
}

export async function sendClientAction(action) {
    if (!active) {
        return;
    }
    if (action.type === 'move') {
        action.x = parseFloat(action.x.toFixed(3));
        action.y = parseFloat(action.y.toFixed(3));
        action.z = parseFloat(action.z.toFixed(3));
        action.yaw = parseFloat(action.yaw.toFixed(4));
        action.pitch = parseFloat(action.pitch.toFixed(4));
    }
    if (['start-breaking', 'pause-breaking', 'pause-breaking'].includes(action.type)) {
        action.x = Math.floor(action.x);
        action.y = Math.floor(action.y);
        action.z = Math.floor(action.z);
    }
    await sendEvent(action);
}

export function update() {
    if (active && player) {
        updateSelfState();
    }
}

export async function processServerPacket(packet) {
    if (packet.event === 'spawn') {
        EntityHandler.addEntityToScene(packet.entity);
        return;
    }

    if (packet.event === 'move' && packet.entity.id !== player?.id) {
        if (EntityHandler.entityRecord[packet.entity.id]) {
            return EntityHandler.setEntityTargetPosition(packet.entity, 500, packet.time);
        }
        return {
            type: 'request-entity',
            id: packet.entity
        }
        return;
    }

    if (packet.event === 'despawn') {
        return EntityHandler.removeEntity(packet.entity.id);
    }

    if (packet.event === 'block') {
        return WorldHandler.set(packet.x, packet.y, packet.z, packet.id);
    }

    if (Object.keys(packet).length === 1 && packet.success === true) {
        return; // Ignore success
    }

    console.warn('Unknown packet', packet);
}
