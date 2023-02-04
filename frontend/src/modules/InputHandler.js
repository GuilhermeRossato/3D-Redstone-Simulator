import * as THREE from '../libs/three.module.js';
import { moveVertically, moveTowardsAngle, setCameraWrapper } from './MovementHandler.js';
import { getChunk, set, get } from './WorldHandler.js';
import getFaceBounds from '../utils/getFaceBounds.js'
import SIDE_DISPLACEMENT from '../data/SideDisplacement.js';

let camera;
let isPointerlocked = false;
let isFullScreen = false;
let isFirstClick = false;
let yawObject = new THREE.Object3D();
let pitchObject = new THREE.Object3D();
let selectionBox;
let targetBlock;
let selectedBlockType = 2;

export let dirty = false;

export const position = yawObject.position;

export const rotation = {
    pitch: pitchObject.rotation.x,
    yaw: yawObject.rotation.y,
}

export function clearDirtyness() {
    dirty = false;
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

    /** @type {{x: number; y: number; z: number; weight: number, fx: number, fy: number, fz: number, sideId: number, tx: number, ty: number, tz: number} | null} */
    let collision = null;

    for (const chunk of chunkList) {
        const c = getChunk(chunk[0], chunk[1], chunk[2]);
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
                    if (collision === null) {
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
                            tz: 0
                        };
                        collision.tx = collision.fx - SIDE_DISPLACEMENT[collision.sideId].inverse[0] / 2;
                        collision.ty = collision.fy - SIDE_DISPLACEMENT[collision.sideId].inverse[1] / 2;
                        collision.tz = collision.fz - SIDE_DISPLACEMENT[collision.sideId].inverse[2] / 2;
                    } else if (collision.weight >= weight) {
                        collision.x = point.x;
                        collision.y = point.y;
                        collision.z = point.z;
                        collision.weight = weight;
                        collision.fx = face.x + chunk[0] * 16;
                        collision.fy = face.y + chunk[1] * 16;
                        collision.fz = face.z + chunk[2] * 16;
                        collision.sideId = face.sideId;
                        collision.tx = collision.fx - SIDE_DISPLACEMENT[collision.sideId].inverse[0] / 2;
                        collision.ty = collision.fy - SIDE_DISPLACEMENT[collision.sideId].inverse[1] / 2;
                        collision.tz = collision.fz - SIDE_DISPLACEMENT[collision.sideId].inverse[2] / 2;
                    }
                }
            }
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
        Math.floor((ox + 0.5)/16), 
        Math.floor((oy + 0.5)/16),
        Math.floor((oz + 0.5)/16)
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

    const tList = [l[0]/dx, l[1]/dy, l[2]/dz];
    
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
        tList[0] = l[0]/dx;
        tList[1] = l[1]/dy;
        tList[2] = l[2]/dz;
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

/*
    const pitchObject = camera;
    const yawObject = camera;
    pitchObject.rotation.set(0, 0, 0);
    */
    setCameraWrapper(yawObject);

    scene.add(yawObject);

    selectionBox = new THREE.Group();

    for (let size of [600, 900, 1500]) {
        selectionBox.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(1 + 1/size, 1 + 1/size, 1 + 1/size)),
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
            dirty = true;
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

    window.addEventListener("keydown", function(event) {
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
    });

    window.addEventListener("keyup", function(event) {
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

    window.addEventListener("mousedown", function(event) {
        if (!isPointerlocked) {
            return;
        }
        if (event.button === 2 && targetBlock) {
            set(
                targetBlock.tx + SIDE_DISPLACEMENT[targetBlock.sideId].inverse[0],
                targetBlock.ty + SIDE_DISPLACEMENT[targetBlock.sideId].inverse[1],
                targetBlock.tz + SIDE_DISPLACEMENT[targetBlock.sideId].inverse[2],
                selectedBlockType
            );
            event.preventDefault();
        }
        if (event.button === 1 && targetBlock) {
            const target = get(targetBlock.tx, targetBlock.ty, targetBlock.tz);
            if (target && target.id) {
                selectedBlockType = target.id;
            }
        }
        if (event.button === 0 && targetBlock) {
            set(
                targetBlock.tx,
                targetBlock.ty,
                targetBlock.tz,
                0
            );
            // Update targetBlock
            targetBlock = getTargetBlock();
            if (targetBlock) {
                if (!selectionBox.visible) {
                    selectionBox.visible = true;
                }
                // SIDE_DISPLACEMENT[targetBlock.sideId].inverse
                selectionBox.position.set(
                    targetBlock.tx,
                    targetBlock.ty,
                    targetBlock.tz
                );
            } else if (selectionBox.visible) {
                selectionBox.visible = false;
            }
            // end update targetblock
            event.preventDefault();
        }
    });

    return { pitchObject, yawObject };
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
    let movementId = forward * 8 + backward * 4 + right * 2 + left;
    if (movementId != 0) {
        dirty = true;
        moveTowardsAngle(angleByMovementId[movementId]);
    }
    if (up && !down) {
        dirty = true;
        moveVertically(1);
    } else if (down && !up) {
        dirty = true;
        moveVertically(-1);
    }
    if (frame % 4 === 0) {
        targetBlock = getTargetBlock();
        if (targetBlock) {
            if (!selectionBox.visible) {
                selectionBox.visible = true;
            }
            // SIDE_DISPLACEMENT[targetBlock.sideId].inverse
            selectionBox.position.set(
                targetBlock.tx,
                targetBlock.ty,
                targetBlock.tz
            );
        } else if (selectionBox.visible) {
            selectionBox.visible = false;
        }
    }
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} yaw
 * @param {number} pitch
 */
export function setPlayerPosition(x, y, z, yaw, pitch) {
    yawObject.position.set(x, y, z);
    if (typeof yaw === 'number' && !isNaN(yaw)) {
        yawObject.rotation.y = yaw;
    }
    if (typeof pitch === 'number' && !isNaN(pitch)) {
        pitchObject.rotation.x = pitch;
    }
}