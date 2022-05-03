import * as THREE from '../libs/three.module.js';
import { moveVertically, moveTowardsAngle, setCameraWrapper } from './MovementHandler.js';

let isPointerlocked = false;
let isFullScreen = false;
let isFirstClick = false;
let yawObject;

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

export async function load(canvas, scene, camera) {
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

    const pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    yawObject = new THREE.Object3D();
    yawObject.name = 'Camera Wrapper';
    yawObject.position.set(camera.position.x, camera.position.y, camera.position.z);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    yawObject.add(pitchObject);
    
/*
    const pitchObject = camera;
    const yawObject = camera;
    pitchObject.rotation.set(0, 0, 0);
    */
    setCameraWrapper(yawObject);

    scene.add(yawObject);

    const PI_2 = Math.PI / 2;

    document.addEventListener("mousemove", (event) => {
        if (!isPointerlocked) {
            return;
        }
        
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max(- PI_2, Math.min(PI_2, pitchObject.rotation.x));
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
            // do nothing
        }
        isPointerlocked = false;
        console.error("Pointer lock error event:", event);
        // requestPointerlock();
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

function update() {
    let movementId = forward * 8 + backward * 4 + right * 2 + left;
    if (movementId != 0) {
        moveTowardsAngle(angleByMovementId[movementId]);
    }
    if (up && !down) {
        moveVertically(1);
    } else if (down && !up) {
        moveVertically(-1);
    }
}

export default {
    load,
    update
};