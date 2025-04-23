import * as THREE from '../libs/three.module.js';
import { moveVertically, moveTowardsAngle } from './MovementHandler.js';
import { getChunk, set, get, resetLocalWorld } from '../world/WorldHandler.js';
import getFaceBounds from '../utils/getFaceBounds.js'
import SIDE_DISPLACEMENT from '../data/SideDisplacement.js';
import { sendPlayerActionToServerEventually } from './Multiplayer/ExternalSelfStateHandler.js';
import { reliveWorld } from './DebugHandler.js';
import * as MultiplayerHandler from './Multiplayer/MultiplayerHandler.js';

let camera;
let isPointerlocked = false;
let isFullScreen = false;
let isFirstClick = false;
export const yawObject = new THREE.Object3D();
export const pitchObject = new THREE.Object3D();
let selectionBox;
let targetBlock;
let selectedBlockType = 2;

export const flags = {
    dirty: false
}

export const position = yawObject.position;

export const rotation = {
    pitch: pitchObject.rotation.x,
    yaw: yawObject.rotation.y,
}

function getTargetBlock() {
    const position = camera.parent.parent.position;
    // createMarker(position.x, position.y, position.z, undefined, undefined, 2);

    // vertical angle
    const pitch = camera.parent.rotation.x;
    // horizontal angle
    const yaw = camera.parent.parent.rotation.y;

    const dx = Math.sin(Math.PI + yaw) * Math.cos(pitch);
    const dy = Math.sin(pitch);
    const dz = Math.cos(Math.PI + yaw) * Math.cos(pitch);

    const chunkList = raycastChunkList(position.x, position.y, position.z, dx, dy, dz, 4, true);
    const ray = new THREE.Ray(new THREE.Vector3(position.x, position.y, position.z), new THREE.Vector3(dx, dy, dz));

    const point = new THREE.Vector3(0, 0, 0);

    /** @type {{x: number; y: number; z: number; weight: number, fx: number, fy: number, fz: number, sideId: number, tx: number, ty: number, tz: number, sx: number, sy: number, sz: number} | null} */
    let collision = null;

    for (const chunk of chunkList) {
        const c = getChunk(chunk[0], chunk[1], chunk[2], false);
        if (!c) {
            continue;
        }
        const faces = c.getFaces(true, false, false);
        if (!faces || faces.length === 0) {
            continue;
        }
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            const bounds = getFaceBounds(face, chunk[0], chunk[1], chunk[2]);
            for (const triangle of [[bounds[2], bounds[1], bounds[0]], [bounds[3], bounds[2], bounds[0]]]) {
                const result = ray.intersectTriangle(triangle[0], triangle[1], triangle[2], false, point);
                if (result) {
                    const weight = (point.x - position.x) / dx;
                    if (collision === null || collision.weight >= weight) {
                        collision = {
                            x: point.x,
                            y: point.y,
                            z: point.z,
                            weight,
                            fx: face.x + chunk[0] * 16,
                            fy: face.y + chunk[1] * 16,
                            fz: face.z + chunk[2] * 16,
                            sideId: face.sideId,
                            tx: 0,
                            ty: 0,
                            tz: 0,
                            sx: 0,
                            sy: 0,
                            sz: 0
                        };
                        if (face.ref.id === 5) {
                            // block is a redstone dust
                            collision.tx = collision.fx;
                            collision.ty = collision.fy + 0 / 16;
                            collision.tz = collision.fz;
                            collision.sx = 1;
                            collision.sy = 1 / 16;
                            collision.sz = 1;
                        } else {
                            collision.tx = collision.fx - SIDE_DISPLACEMENT[collision.sideId].inverse[0] / 2;
                            collision.ty = collision.fy - SIDE_DISPLACEMENT[collision.sideId].inverse[1] / 2;
                            collision.tz = collision.fz - SIDE_DISPLACEMENT[collision.sideId].inverse[2] / 2;
                            collision.sx = 1;
                            collision.sy = 1;
                            collision.sz = 1;
                        }
                    }
                }
            }
        }
        if (collision) {
            break;
        }
    }

    return collision;
}

/**
 * Get a list of all chunks that intersect a point (oy,oy,oz) and a direction (dx, dy, dz)
 * Up to a specific amount of chunks (maxChunkCount) optionally adding the origin chunk (includeSelf)
 */
function raycastChunkList(ox, oy, oz, dx, dy, dz, maxChunkCount = 4, includeSelf = true) {
    const c = [
        Math.floor((ox + 0.5) / 16),
        Math.floor((oy + 0.5) / 16),
        Math.floor((oz + 0.5) / 16)
    ];

    const chunkList = [];
    if (includeSelf) {
        chunkList.push([c[0], c[1], c[2]]);
    }

    const l = [
        ((dx > 0) ? (c[0] + 1) * 16 : c[0] * 16) - ox - 0.5,
        ((dy > 0) ? (c[1] + 1) * 16 : c[1] * 16) - oy - 0.5,
        ((dz > 0) ? (c[2] + 1) * 16 : c[2] * 16) - oz - 0.5
    ];

    const tList = [l[0] / dx, l[1] / dy, l[2] / dz];

    let nextChunkIsFoundByWhichAxis = 0;
    if (Math.abs(tList[0]) < Math.abs(tList[1])) {
        if (Math.abs(tList[2]) < Math.abs(tList[0])) {
            nextChunkIsFoundByWhichAxis = 2;
        } else {
            nextChunkIsFoundByWhichAxis = 0;
        }
    } else if (Math.abs(tList[0]) < Math.abs(tList[2])) {
        if (Math.abs(tList[1]) < Math.abs(tList[0])) {
            nextChunkIsFoundByWhichAxis = 1;
        } else {
            nextChunkIsFoundByWhichAxis = 0;
        }
    } else if (Math.abs(tList[2]) < Math.abs(tList[0])) {
        if (Math.abs(tList[1]) < Math.abs(tList[2])) {
            nextChunkIsFoundByWhichAxis = 1;
        } else {
            nextChunkIsFoundByWhichAxis = 2;
        }
    }

    const t = tList[nextChunkIsFoundByWhichAxis];

    const nextChunkOffset = [dx * t, dy * t, dz * t];

    const o = [ox, oy, oz];
    o[0] += nextChunkOffset[0];
    o[1] += nextChunkOffset[1];
    o[2] += nextChunkOffset[2];

    for (let i = 0; i < maxChunkCount - (includeSelf ? 1 : 0); i++) {
        c[nextChunkIsFoundByWhichAxis] += l[nextChunkIsFoundByWhichAxis] > 0 ? 1 : -1;
        chunkList.push([c[0], c[1], c[2]]);
        l[0] = ((dx > 0) ? (c[0] + 1) * 16 : c[0] * 16) - o[0] - 0.5;
        l[1] = ((dy > 0) ? (c[1] + 1) * 16 : c[1] * 16) - o[1] - 0.5;
        l[2] = ((dz > 0) ? (c[2] + 1) * 16 : c[2] * 16) - o[2] - 0.5;
        tList[0] = l[0] / dx;
        tList[1] = l[1] / dy;
        tList[2] = l[2] / dz;
        if (Math.abs(tList[0]) < Math.abs(tList[1])) {
            if (Math.abs(tList[2]) < Math.abs(tList[0])) {
                nextChunkIsFoundByWhichAxis = 2;
            } else {
                nextChunkIsFoundByWhichAxis = 0;
            }
        } else if (Math.abs(tList[0]) < Math.abs(tList[2])) {
            if (Math.abs(tList[1]) < Math.abs(tList[0])) {
                nextChunkIsFoundByWhichAxis = 1;
            } else {
                nextChunkIsFoundByWhichAxis = 0;
            }
        } else if (Math.abs(tList[2]) < Math.abs(tList[0])) {
            if (Math.abs(tList[1]) < Math.abs(tList[2])) {
                nextChunkIsFoundByWhichAxis = 1;
            } else {
                nextChunkIsFoundByWhichAxis = 2;
            }
        }
        const t = tList[nextChunkIsFoundByWhichAxis];
        nextChunkOffset[0] = dx * t;
        nextChunkOffset[1] = dy * t;
        nextChunkOffset[2] = dz * t;
        o[0] += nextChunkOffset[0];
        o[1] += nextChunkOffset[1];
        o[2] += nextChunkOffset[2];
        // createMarker(o[0], o[1], o[2], i % 2 === 0 ? 0xFF0000 : 0x00FF00, undefined, 120);
    }
    return chunkList;
}

function requestPointerlock() {
    document.body.requestPointerLock();
}

function fullScreenRequestUnsuccessful() {
    isPointerlocked = false;
}

let forward = 0;
let right = 0;
let left = 0;
let backward = 0;
let up = 0;
let down = 0;

export async function load(canvas, scene, receivedCamera) {
    camera = receivedCamera;

    canvas.addEventListener("click", (_event) => {
        if (isFirstClick && !isFullScreen) {
            isFirstClick = false;
            document.body.requestFullscreen().then(
                requestPointerlock,
                fullScreenRequestUnsuccessful
            )
        } else if (!isPointerlocked) {
            requestPointerlock();
        }
    });

    pitchObject.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
    pitchObject.add(camera);

    yawObject.name = 'Camera Wrapper';
    yawObject.position.set(camera.position.x, camera.position.y, camera.position.z);
    yawObject.add(pitchObject);

    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);

    scene.add(yawObject);

    selectionBox = new THREE.Group();

    for (let size of [600, 900, 1500]) {
        selectionBox.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(1 + 1 / size, 1 + 1 / size, 1 + 1 / size)),
            new THREE.LineBasicMaterial({
                color: new THREE.Color(0x222222)
            })
        ));
    }

    scene.add(selectionBox);

    const PI_2 = Math.PI / 2;

    document.addEventListener("mousemove", (event) => {
        if (!isPointerlocked) {
            return;
        }

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        if (movementX !== 0 || movementY !== 0) {
            flags.dirty = true;
        }

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max(- PI_2, Math.min(PI_2, pitchObject.rotation.x));

        rotation.pitch = pitchObject.rotation.x;
        rotation.yaw = yawObject.rotation.y;
    });

    document.addEventListener("fullscreenChange", function () {
        isFullScreen = document.fullscreenElement != null;
    });

    document.addEventListener("pointerlockchange", function (_event) {
        isPointerlocked = (document.pointerLockElement !== null && document.pointerLockElement !== undefined);
    });

    document.addEventListener("pointerlockerror", function (event) {
        try {
            document.exitPointerLock();
        } catch (err) {
            // do nothing on error
        }
        isPointerlocked = false;
        console.error("Pointer lock error event:", event);
        // requestPointerlock(); // Do not call again because it will just fail again in loop
    });

    window.addEventListener("keydown", (event) => {
        if (event.code === 'KeyW') {
            forward = 1;
        } else if (event.code === 'KeyA') {
            left = 1;
        } else if (event.code === 'KeyS') {
            backward = 1;
        } else if (event.code === 'KeyD') {
            right = 1;
        } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            down = 1;
        } else if (event.code === 'Space') {
            up = 1;
        }
        if (event.code === 'KeyR') {
            if (MultiplayerHandler.active) {
                launchReliveWorld();
            } else {
                resetLocalWorld();
            }
        }
        if (event.code === 'Digit1' || event.code === 'Numpad1') {
            selectedBlockType = 1;
        } else if (event.code === 'Digit2' || event.code === 'Numpad2') {
            selectedBlockType = 2;
        } else if (event.code === 'Digit3' || event.code === 'Numpad3') {
            selectedBlockType = 3;
        } else if (event.code === 'Digit4' || event.code === 'Numpad4') {
            selectedBlockType = 4;
        }
    });

    window.addEventListener("keyup", (event) => {
        if (event.code === 'KeyW') {
            forward = 0;
        } else if (event.code === 'KeyA') {
            left = 0;
        } else if (event.code === 'KeyS') {
            backward = 0;
        } else if (event.code === 'KeyD') {
            right = 0;
        } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            down = 0;
        } else if (event.code === 'Space') {
            up = 0;
        }
    });

    window.addEventListener("mousedown", function (event) {
        if (!isPointerlocked) {
            return;
        }
        const isLeftClick = event.button === 0;
        const isMiddleClick = event.button === 1;
        const isRightClick = event.button === 2;
        if (isRightClick && targetBlock) {
            issueBlockCreationRequest(
                targetBlock.tx + SIDE_DISPLACEMENT[targetBlock.sideId].inverse[0],
                targetBlock.ty + SIDE_DISPLACEMENT[targetBlock.sideId].inverse[1],
                targetBlock.tz + SIDE_DISPLACEMENT[targetBlock.sideId].inverse[2],
                selectedBlockType
            );
            event.preventDefault();
            return;
        }
        if (isMiddleClick && targetBlock) {
            const target = get(targetBlock.tx, targetBlock.ty, targetBlock.tz);
            if (target && target.id) {
                selectedBlockType = target.id;
            }
            return;
        }
        if (isLeftClick && targetBlock) {
            issueBlockDestructionRequest(targetBlock.tx, targetBlock.ty, targetBlock.tz);
            event.preventDefault();
        }
    });

    return { pitchObject, yawObject };
}

let isReliveWorldActive = false;
function launchReliveWorld() {
    if (isReliveWorldActive) {
        console.log('Skipped relive world because it is currently active');
        return;
    }
    isReliveWorldActive = true;
    const cx = Math.floor(position.x / 16);
    const cy = Math.floor(position.y / 16);
    const cz = Math.floor(position.z / 16);
    reliveWorld(cx, cy, cz).then(() => {
        console.log('Relive world finished');
        isReliveWorldActive = false;
    }).catch((err) => {
        console.log('Relive world failed:', err);
        isReliveWorldActive = false;
    });
}

let nextUpdateAction = null;

function issueBlockCreationRequest(x, y, z, id) {
    nextUpdateAction = { type: 'create', x, y, z, id };
}

function issueBlockDestructionRequest(x, y, z) {
    nextUpdateAction = { type: 'delete', x, y, z };
    selectionBox.visible = false;
}

const angleByMovementId = {
    '1': Math.PI * (0.5),
    '2': Math.PI * (-0.5),
    '3': Math.PI * (0),
    '4': Math.PI * (-1),
    '5': Math.PI * (-1.25),
    '6': Math.PI * (-0.75),
    '7': Math.PI * (-1),
    '8': Math.PI * (0),
    '9': Math.PI * (0.25),
    '10': Math.PI * (-0.25),
    '11': Math.PI * (0),
    '12': Math.PI * (0),
    '13': Math.PI * (0.5),
    '14': Math.PI * (-0.5),
    '15': Math.PI * (0),
}

export function update(frame) {
    const movementId = forward * 8 + backward * 4 + right * 2 + left;
    if (movementId != 0) {
        flags.dirty = true;
        moveTowardsAngle(angleByMovementId[movementId]);
    }
    if (up && !down) {
        flags.dirty = true;
        moveVertically(1);
    } else if (down && !up) {
        flags.dirty = true;
        moveVertically(-1);
    }
    if (nextUpdateAction) {
        if (nextUpdateAction.y === 0 && (nextUpdateAction.x === 0 || nextUpdateAction.x === 1) && (nextUpdateAction.z === 0 || nextUpdateAction.z === 1)) {
            // Do not change the four fundamental blocks
            nextUpdateAction = null;
            return;
        }
        if (nextUpdateAction.type === 'create') {
            set(nextUpdateAction.x, nextUpdateAction.y, nextUpdateAction.z, nextUpdateAction.id);
            sendPlayerActionToServerEventually({ type: 'block', x: nextUpdateAction.x, y: nextUpdateAction.y, z: nextUpdateAction.z, id: nextUpdateAction.id });
            nextUpdateAction = null;
        } else if (nextUpdateAction.type === 'delete') {
            set(nextUpdateAction.x, nextUpdateAction.y, nextUpdateAction.z, 0);
            selectionBox.visible = false;
            frame = 0; // This makes the selection box be updated
            sendPlayerActionToServerEventually({ type: 'block', x: nextUpdateAction.x, y: nextUpdateAction.y, z: nextUpdateAction.z, id: 0 });
            nextUpdateAction = null;
        }
    }
    // Update selection box every 4th frame
    if (frame % 4 === 0) {
        targetBlock = getTargetBlock();
        if (targetBlock) {
            if (!selectionBox.visible) {
                selectionBox.visible = true;
            }
            // SIDE_DISPLACEMENT[targetBlock.sideId].inverse
            if (selectionBox.position.x !== targetBlock.tx || selectionBox.position.y !== targetBlock.ty || selectionBox.position.z !== targetBlock.tz) {
                selectionBox.position.set(targetBlock.tx, targetBlock.ty, targetBlock.tz);
            }
            if (selectionBox.scale.x !== targetBlock.sx || selectionBox.scale.y !== targetBlock.sy || selectionBox.scale.z !== targetBlock.sz) {
                selectionBox.scale.set(targetBlock.sx, targetBlock.sy, targetBlock.sz);
            }
        } else if (selectionBox.visible) {
            selectionBox.visible = false;
        }
    }
}

/**
 * @param {{ x: number; y: number; z: number; yaw?: number; pitch?: number; }} position
 */
export function setPlayerPosition(position) {
  console.log("Setting player position", position);
    const { x, y, z, yaw, pitch } = position;
    yawObject.position.set(x, y, z);
    if (typeof yaw === 'number' && !isNaN(yaw)) {
        yawObject.rotation.y = yaw;
    }
    if (typeof pitch === 'number' && !isNaN(pitch)) {
        pitchObject.rotation.x = pitch;
    }
}