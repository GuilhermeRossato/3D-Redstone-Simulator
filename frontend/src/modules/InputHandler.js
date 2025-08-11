import * as THREE from "../libs/three.module.js";
import { moveVertically, moveTowardsAngle } from "./MovementHandler.js";
import { getChunk, set, get, resetLocalWorld } from "../world/WorldHandler.js";
import getFaceBounds from "../utils/getFaceBounds.js";
import SIDE_DISPLACEMENT from "../data/SideDisplacement.js";
import { sendPlayerActionToServerEventually } from "./Multiplayer/ExternalSelfStateHandler.js";
import { reliveWorld } from "./DebugHandler.js";
import * as MultiplayerHandler from "./Multiplayer/MultiplayerHandler.js";
import * as ForegroundHandler from "./ForegroundHandler.js";


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
  dirty: false,
  isMobileControlsActive: false,
};

let activeTouches = {};

function handleTouchEvent(event) {
  if (event.type === 'touchstart') {
    for (const touch of event.changedTouches) {
      activeTouches[touch.identifier] = { startX: touch.clientX, startY: touch.clientY, lastX: touch.clientX, lastY: touch.clientY };
    }
  } else if (event.type === 'touchmove') {
    for (const touch of event.changedTouches) {
      const activeTouch = activeTouches[touch.identifier];
      if (activeTouch) {
        const deltaX = touch.clientX - activeTouch.lastX;
        const deltaY = touch.clientY - activeTouch.lastY;

        activeTouch.lastX = touch.clientX;
        activeTouch.lastY = touch.clientY;
        console.log(`Touch ${touch.identifier} moved: deltaX=${deltaX}, deltaY=${deltaY}`);
        if (touch.startX > window.innerWidth / 2) {
          
        }
      }
    }
  } else if (event.type === 'touchend' || event.type === 'touchcancel') {
    for (const touch of event.changedTouches) {
      delete activeTouches[touch.identifier];
    }
  }
  console.log(event.type);
}

function handleDirectionalClick(event) {
  if (event.type === "click" || event.type === "touchstart" || event.type === "touchmove") {
    const button = document.querySelector(".mobile-controls button");
    if (!button) {
      console.warn("Button not found");
      return;
    }

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;
    if (event.type === "click") {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event.type === "touchstart" || event.type === "touchmove") {
      const touch = event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    }

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX);

    console.log(`Distance: ${distance}, Angle: ${angle}`);
  }
}


function startMobileControls() {
  if (flags.isMobileControlsActive) {
    console.warn("Mobile controls are already active, skipping");
    return;
  }
  console.log('Activating mobile controls...');
  flags.isMobileControlsActive = true;
  localStorage.setItem("mobile-control-open", String(Date.now()));
  const mobileControls = document.querySelector(".mobile-controls");
  if (mobileControls instanceof HTMLElement) {
    mobileControls.style.display = 'flex';
  }
  const btn = document.querySelector(".mobile-controls button");
  btn.addEventListener("click", handleDirectionalClick);
  btn.addEventListener("touchstart", handleDirectionalClick);
  btn.addEventListener("touchmove", handleDirectionalClick);
  window.addEventListener("touchend", handleDirectionalClick);
  window.addEventListener("touchcancel", handleDirectionalClick);
}

function stopMobileControls() {
  if (!flags.isMobileControlsActive) {
    console.warn("Mobile controls are already inactive, skipping");
    return;
  }
  localStorage.removeItem("mobile-control-open");
  flags.isMobileControlsActive = false;
  const mobileControls = document.querySelector(".mobile-controls");
  if (mobileControls instanceof HTMLElement) {
    mobileControls.style.display = 'none';
  }
  const btn = document.querySelector(".mobile-controls button");
  btn.removeEventListener("click", handleDirectionalClick);
  btn.removeEventListener("touchstart", handleDirectionalClick);
  window.removeEventListener("touchend", handleDirectionalClick);
  window.removeEventListener("touchcancel", handleDirectionalClick);
}

export const position = yawObject.position;

export const rotation = {
  pitch: pitchObject.rotation.x,
  yaw: yawObject.rotation.y,
};

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

  const chunkList = raycastChunkList(
    position.x,
    position.y,
    position.z,
    dx,
    dy,
    dz,
    4,
    true
  );
  const ray = new THREE.Ray(
    new THREE.Vector3(position.x, position.y, position.z),
    new THREE.Vector3(dx, dy, dz)
  );

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
      for (const triangle of [
        [bounds[2], bounds[1], bounds[0]],
        [bounds[3], bounds[2], bounds[0]],
      ]) {
        const result = ray.intersectTriangle(
          triangle[0],
          triangle[1],
          triangle[2],
          false,
          point
        );
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
              sz: 0,
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
              collision.tx =
                collision.fx -
                SIDE_DISPLACEMENT[collision.sideId].inverse[0] / 2;
              collision.ty =
                collision.fy -
                SIDE_DISPLACEMENT[collision.sideId].inverse[1] / 2;
              collision.tz =
                collision.fz -
                SIDE_DISPLACEMENT[collision.sideId].inverse[2] / 2;
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
function raycastChunkList(
  ox,
  oy,
  oz,
  dx,
  dy,
  dz,
  maxChunkCount = 4,
  includeSelf = true
) {
  const c = [
    Math.floor((ox + 0.5) / 16),
    Math.floor((oy + 0.5) / 16),
    Math.floor((oz + 0.5) / 16),
  ];

  const chunkList = [];
  if (includeSelf) {
    chunkList.push([c[0], c[1], c[2]]);
  }

  const l = [
    (dx > 0 ? (c[0] + 1) * 16 : c[0] * 16) - ox - 0.5,
    (dy > 0 ? (c[1] + 1) * 16 : c[1] * 16) - oy - 0.5,
    (dz > 0 ? (c[2] + 1) * 16 : c[2] * 16) - oz - 0.5,
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
    c[nextChunkIsFoundByWhichAxis] +=
      l[nextChunkIsFoundByWhichAxis] > 0 ? 1 : -1;
    chunkList.push([c[0], c[1], c[2]]);
    l[0] = (dx > 0 ? (c[0] + 1) * 16 : c[0] * 16) - o[0] - 0.5;
    l[1] = (dy > 0 ? (c[1] + 1) * 16 : c[1] * 16) - o[1] - 0.5;
    l[2] = (dz > 0 ? (c[2] + 1) * 16 : c[2] * 16) - o[2] - 0.5;
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
let menuOpenTime = 0;
export async function load(canvas, scene, receivedCamera) {
  camera = receivedCamera;
  
  const stored = localStorage.getItem("mobile-control-open");
  if (stored && ((stored === '1')|| ((Date.now() - parseInt(stored || String(Date.now()))) < 5 * 60 * 1000))) {
    startMobileControls();
  } else {
    console.log('Not initialized in mobile mode');
  }

  let mouseMoveCount = 0;
  let touchMoveCount = 0;

  window.addEventListener("touchstart", (event) => {
    if (flags.isMobileControlsActive) {
      return handleTouchEvent(event);
    }
    if (!flags.isMobileControlsActive && touchMoveCount < 200) {
      touchMoveCount += 5;
    }
  });

  window.addEventListener("mousemove", (event) => {
    if (flags.isMobileControlsActive) {
      return handleTouchEvent(event);
    }
    if (!flags.isMobileControlsActive && mouseMoveCount < 200) {
      mouseMoveCount += 1;
    }
  });

  window.addEventListener("touchmove", (event) => {
    if (flags.isMobileControlsActive) {
      return handleTouchEvent(event);
    }
    if (!flags.isMobileControlsActive && touchMoveCount < 200) {
      touchMoveCount += 3;
    }
  });
  //setInterval(() => { console.log(`Mouse move count: ${mouseMoveCount}`); console.log(`Touch move count: ${touchMoveCount}`); }, 2000);

  canvas.addEventListener("click", (event) => {
    if (isFirstClick && !isFullScreen) {
      isFirstClick = false;
      document.body
        .requestFullscreen()
        .then(requestPointerlock, fullScreenRequestUnsuccessful);
    } else if (!isPointerlocked) {
      if (ForegroundHandler.flags.chatOpened) {
        if (Math.abs(Date.now() - menuOpenTime) < 750) {
          return;
        }
        ForegroundHandler.closeChat();
      } else if (event.clientY > window.innerHeight * 0.8) {
        return;
      }
      requestPointerlock();
    }
  });
  
    let lastPlayerPose = (sessionStorage.getItem('last-player-pose')||'0').split(',').map(i => parseFloat(i))
    if (lastPlayerPose.length < 3||lastPlayerPose.slice(0, 6).some(num=>isNaN(num))) {
      lastPlayerPose = (localStorage.getItem('last-player-pose')||'0').split(',').map(i => parseFloat(i));
    }
     if (lastPlayerPose.length < 3||lastPlayerPose.slice(0, 6).some(num=>isNaN(num))) {
      lastPlayerPose = [];
    }
  if (lastPlayerPose.length >= 3 && lastPlayerPose.slice(0, 5).every((v) => !isNaN(v))) {
    console.log("Initializing last local player position.");
    setPlayerPosition(lastPlayerPose);
  } else {
    console.log("No valid last player position found, using default");
    pitchObject.rotation.set(
      camera.rotation.x,
      camera.rotation.y,
      camera.rotation.z
    );
    yawObject.position.set(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
  }

  yawObject.name = "Camera Wrapper";
  pitchObject.add(camera);
  yawObject.add(pitchObject);

  camera.position.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);

  scene.add(yawObject);

  selectionBox = new THREE.Group();

  for (let size of [600, 900, 1500]) {
    selectionBox.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(
          new THREE.BoxGeometry(1 + 1 / size, 1 + 1 / size, 1 + 1 / size)
        ),
        new THREE.LineBasicMaterial({
          color: new THREE.Color(0x222222),
        })
      )
    );
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

    pitchObject.rotation.x = Math.max(
      -PI_2,
      Math.min(PI_2, pitchObject.rotation.x)
    );
    if (
      !flags.dirty &&
      Math.abs(rotation.pitch - pitchObject.rotation.x) > 0.001
    ) {
      flags.dirty = true;
    }
    rotation.pitch = pitchObject.rotation.x;
    if (!flags.dirty && Math.abs(rotation.yaw - yawObject.rotation.y) > 0.001) {
      flags.dirty = true;
    }
    rotation.yaw = yawObject.rotation.y;
  });

  document.addEventListener("fullscreenChange", function () {
    isFullScreen = document.fullscreenElement != null;
  });

  document.addEventListener("pointerlockchange", function (_event) {
    isPointerlocked =
      document.pointerLockElement !== null &&
      document.pointerLockElement !== undefined;
    if (!isPointerlocked && !ForegroundHandler.flags.chatOpened) {
      menuOpenTime = Date.now();
      ForegroundHandler.openChat();
    } else if (isPointerlocked && flags.isMobileControlsActive) {
      stopMobileControls();
    }
  });

  document.addEventListener("pointerlockerror", function (event) {
    try {
      document.exitPointerLock();
    } catch (err) {
      // do nothing on error
    }
    isPointerlocked = false;
    if (!flags.mobileControlsActive) {
      console.error("Pointer lock error event:", event);
      // requestPointerlock(); // Do not call again because it will just fail again in loop
      if (mouseMoveCount < touchMoveCount) {
        console.log('Initializing mobile controls');
        startMobileControls();
      }
    }
  });

  window.addEventListener("keydown", (event) => {
    if (flags.isMobileControlsActive && event.code === "Escape") {
      stopMobileControls();
      return;
    }
    if (ForegroundHandler.flags.chatOpened) {
      // console.log("Chat opened, handling keydown event:", event);
      if (event.code === "Escape" || (event.code === "ArrowLeft" && event.altKey)) {
        ForegroundHandler.closeChat();
        requestPointerlock();
      }
      if (event.code === "Enter" || event.code === "Return" || event.key === "Enter" || event.key === "Return") {
        ForegroundHandler.sendChatMessage();
      }
      return;
    }
    if (event.code === "KeyW") {
      forward = 1;
    } else if (event.code === "KeyA") {
      left = 1;
    } else if (event.code === "KeyS") {
      backward = 1;
    } else if (event.code === "KeyD") {
      right = 1;
    } else if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      down = 1;
    } else if (event.code === "Space") {
      up = 1;
    }
    if (event.code === "KeyR") {
      if (MultiplayerHandler.active) {
        launchReliveWorld();
      } else {
        resetLocalWorld();
      }
    }
    if (event.code === "Digit1" || event.code === "Numpad1") {
      selectedBlockType = 1;
    } else if (event.code === "Digit2" || event.code === "Numpad2") {
      selectedBlockType = 2;
    } else if (event.code === "Digit3" || event.code === "Numpad3") {
      selectedBlockType = 3;
    } else if (event.code === "Digit4" || event.code === "Numpad4") {
      selectedBlockType = 4;
    } else if (event.code === "KeyT" || event.code === "KeyI" || (event.code === "KeyC" && event.ctrlKey)) {
      if (isPointerlocked) {
        try {
          document.exitPointerLock();
          isPointerlocked = false;
        } catch (err) {
          console.error("Error exiting pointer lock:", err);
        }
      }
      menuOpenTime = Date.now();
      ForegroundHandler.openChat();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "KeyW") {
      forward = 0;
    } else if (event.code === "KeyA") {
      left = 0;
    } else if (event.code === "KeyS") {
      backward = 0;
    } else if (event.code === "KeyD") {
      right = 0;
    } else if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      down = 0;
    } else if (event.code === "Space") {
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
      issueBlockDestructionRequest(
        targetBlock.tx,
        targetBlock.ty,
        targetBlock.tz
      );
      event.preventDefault();
    }
  });

  return { pitchObject, yawObject };
}

let isReliveWorldActive = false;
function launchReliveWorld() {
  if (isReliveWorldActive) {
    console.log("Skipped relive world because it is currently active");
    return;
  }
  isReliveWorldActive = true;
  const cx = Math.floor(position.x / 16);
  const cy = Math.floor(position.y / 16);
  const cz = Math.floor(position.z / 16);
  reliveWorld(cx, cy, cz)
    .then(() => {
      console.log("Relive world finished");
      isReliveWorldActive = false;
    })
    .catch((err) => {
      console.log("Relive world failed:", err);
      isReliveWorldActive = false;
    });
}

let nextUpdateAction = null;

function issueBlockCreationRequest(x, y, z, id) {
  nextUpdateAction = { type: "create", x, y, z, id };
}

function issueBlockDestructionRequest(x, y, z) {
  nextUpdateAction = { type: "delete", x, y, z };
  selectionBox.visible = false;
}

const angleByMovementId = {
  1: Math.PI * 0.5,
  2: Math.PI * -0.5,
  3: Math.PI * 0,
  4: Math.PI * -1,
  5: Math.PI * -1.25,
  6: Math.PI * -0.75,
  7: Math.PI * -1,
  8: Math.PI * 0,
  9: Math.PI * 0.25,
  10: Math.PI * -0.25,
  11: Math.PI * 0,
  12: Math.PI * 0,
  13: Math.PI * 0.5,
  14: Math.PI * -0.5,
  15: Math.PI * 0,
};

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
    if (
      nextUpdateAction.y === 0 &&
      (nextUpdateAction.x === 0 || nextUpdateAction.x === 1) &&
      (nextUpdateAction.z === 0 || nextUpdateAction.z === 1)
    ) {
      // Do not change the four fundamental blocks
      nextUpdateAction = null;
      return;
    }
    if (nextUpdateAction.type === "create") {
      set(
        nextUpdateAction.x,
        nextUpdateAction.y,
        nextUpdateAction.z,
        nextUpdateAction.id
      );
      sendPlayerActionToServerEventually({
        type: "place",
        x: nextUpdateAction.x,
        y: nextUpdateAction.y,
        z: nextUpdateAction.z,
        id: nextUpdateAction.id,
      });
      nextUpdateAction = null;
    } else if (nextUpdateAction.type === "delete") {
      set(nextUpdateAction.x, nextUpdateAction.y, nextUpdateAction.z, 0);
      selectionBox.visible = false;
      frame = 0; // This makes the selection box be updated
      sendPlayerActionToServerEventually({
        type: "punch",
        x: nextUpdateAction.x,
        y: nextUpdateAction.y,
        z: nextUpdateAction.z,
      });
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
      if (
        selectionBox.position.x !== targetBlock.tx ||
        selectionBox.position.y !== targetBlock.ty ||
        selectionBox.position.z !== targetBlock.tz
      ) {
        selectionBox.position.set(
          targetBlock.tx,
          targetBlock.ty,
          targetBlock.tz
        );
      }
      if (
        selectionBox.scale.x !== targetBlock.sx ||
        selectionBox.scale.y !== targetBlock.sy ||
        selectionBox.scale.z !== targetBlock.sz
      ) {
        selectionBox.scale.set(targetBlock.sx, targetBlock.sy, targetBlock.sz);
      }
    } else if (selectionBox.visible) {
      selectionBox.visible = false;
    }
  }
}

/**
 * @param {{ x: number; y: number; z: number; yaw?: number; pitch?: number; } | number[]} position
 * @param {{ x: number; y: number; z: number; yaw?: number; pitch?: number; } | number[]} [direction]
 */
export function setPlayerPosition(position, direction) {
  console.log("Setting player position", position);
  const x = position["x"] || position[0];
  const y = position["y"] || position[1];
  const z = position["z"] || position[2];
  yawObject.position.set(x, y, z);
  if (
    !direction &&
    position instanceof Array &&
    position.length === 6 &&
    typeof position[3] === "number" &&
    !isNaN(position[3]) &&
    typeof position[4] === "number" &&
    !isNaN(position[4]) &&
    typeof position[5] === "number" &&
    !isNaN(position[5]) &&
    position[5] !== 0
  ) {
    // Look at the direction
  }
  const yaw =
    position["yaw"] || position[3] || direction?.["yaw"] || direction?.[0];
  const pitch =
    position["pitch"] || position[4] || direction?.["pitch"] || direction?.[1];
  if (typeof yaw === "number" && !isNaN(yaw)) {
    yawObject.rotation.y = yaw;
  }
  if (typeof pitch === "number" && !isNaN(pitch)) {
    pitchObject.rotation.x = pitch;
  }
}
