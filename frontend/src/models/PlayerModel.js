import * as THREE from '../libs/three.module.js';
import { scene } from '../modules/GraphicsHandler.js';
import { g } from '../utils/g.js';
const textureLoader = new THREE.TextureLoader();
const playerTextureRecord = {};

const faceOrder = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'];

async function createPlayerTexture(url) {
  if (playerTextureRecord[url]) {
    return playerTextureRecord[url];
  }
  const texture = await textureLoader.loadAsync(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  playerTextureRecord[url] = texture;
  return texture;
}


function createCubeMaterial(texture, uvMappings) {
  /** @type {any} */
  const materials = [];
  const textureSize = 64;
  for (const face of faceOrder) {
    const mapping = uvMappings[face];
    if (mapping && texture) {
      const material = new THREE.MeshLambertMaterial({ map: texture.clone() });
      const [x1, y1, x2, y2] = mapping;
      const u1 = x1 / textureSize;
      const v1 = 1 - (y2 / textureSize);
      const u2 = x2 / textureSize;
      const v2 = 1 - (y1 / textureSize);
      material.map.repeat.set(u2 - u1, v2 - v1);
      material.map.offset.set(u1, v1);
      material.map.wrapS = THREE.ClampToEdgeWrapping;
      material.map.wrapT = THREE.ClampToEdgeWrapping;
      materials.push(material);
    } else {
      materials.push(new THREE.MeshLambertMaterial({ color: 0xff00ff })); // Pink for missing faces
    }
  }
  return materials;
}

function range(i,j,step=1) {
  const arr = [];
  for (let k = i; k < j; k+=step) {
    arr.push(k);
  }
  return arr;
}

const list = range(-32, 32+1, 1).map(i=>0.1666*Math.PI*(i/32)).map(i=>Math.sin(i));

export function applyLegMovement(group) {
  const [leftLegPivot, rightLegPivot] = group.children.slice(group.children.length-2);
  if (!leftLegPivot || !rightLegPivot) {
    console.error("Leg pivots not found in group");
    return;
  }
  const i = rightLegPivot.userData.lastRotation = ((rightLegPivot.userData.lastRotation || 0)+1)%list.length;
  rightLegPivot.rotation.x = list[i];
  leftLegPivot.rotation.x = -list[i];
}

export function applyPlayerPose(group, player, x, y, z, yaw, pitch) {
  if (!group?.parent||!group?.position) {
    console.error("Invalid group or group position");
    return;
  }
  group.position.set(x, y, z);
  group.rotation.set(0, yaw, 0);
  group.children[0].rotateOnAxis(new THREE.Vector3(0, 1, 0), pitch);
}

g('applyPlayerPose', applyPlayerPose);

export async function createPlayerMesh(name) {
  const prefix = '/3D-Redstone-Simulator/frontend/assets/skins';
  const isAuthor = name.toLowerCase().startsWith("gui") || name.toLowerCase().startsWith("gravy");
  const group = new THREE.Group();
  group.name = name;
  const playerTexture = await createPlayerTexture(`${prefix}/${isAuthor ? 'gravyness.png' : Math.random() > 0.5 ? 'a.png' : 'b.png'}`);
  // Head (8x8x8 pixels)
  const headGeometry = new THREE.BoxGeometry(8 / 16, 8 / 16, 8 / 16, 1, 1, 1);
  const headUV = {
    Right: [0, 8, 8, 16],    // Head Right
    Left: [16, 8, 24, 16],   // Head Left  
    Top: [8, 0, 16, 8],      // Head Top
    Bottom: [16, 0, 24, 8],  // Head Bottom
    Front: [8, 8, 16, 16],   // Head Front
    Back: [24, 8, 32, 16]    // Head Back
  };
  const headMaterials = createCubeMaterial(playerTexture, headUV);
  const head = new THREE.Mesh(headGeometry, headMaterials);
  head.name = "Head";
  head.position.set(0, 22 / 16, 0); // Position head at top

  // Body/Torso (8x12x4 pixels)
  const bodyGeometry = new THREE.BoxGeometry(8 / 16, 12 / 16, 4 / 16, 1, 1, 1);
  const bodyUV = {
    Right: [16, 20, 20, 32],   // Torso Right
    Left: [28, 20, 32, 32],    // Torso Left
    Top: [20, 16, 28, 20],     // Torso Top
    Bottom: [28, 16, 36, 20],  // Torso Bottom
    Front: [20, 20, 28, 32],   // Torso Front
    Back: [32, 20, 40, 32]     // Torso Back
  };
  const bodyMaterials = createCubeMaterial(playerTexture, bodyUV);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterials);
  body.name = "Body";
  body.position.set(0, 12 / 16, 0);

  // Right Arm (4x12x4 pixels)
  const rightArmGeometry = new THREE.BoxGeometry(4 / 16, 12 / 16, 4 / 16, 1, 1, 1);
  const rightArmUV = {
    Right: [40, 20, 44, 32],   // Right Arm Right
    Left: [48, 20, 52, 32],    // Right Arm Left
    Top: [44, 16, 48, 20],     // Right Arm Top
    Bottom: [48, 16, 52, 20],  // Right Arm Bottom
    Front: [44, 20, 48, 32],   // Right Arm Front
    Back: [52, 20, 56, 32]     // Right Arm Back
  };
  const rightArmMaterials = createCubeMaterial(playerTexture, rightArmUV);
  const rightArm = new THREE.Mesh(rightArmGeometry, rightArmMaterials);
  rightArm.name = "RightArm";
  rightArm.position.set(-6 / 16, 12 / 16, 0); // Position to left side (from player's perspective)

  // Left Arm (4x12x4 pixels) - Using 1.8+ skin format
  const leftArmGeometry = new THREE.BoxGeometry(4 / 16, 12 / 16, 4 / 16, 1, 1, 1);
  const leftArmUV = {
    Right: [32, 52, 36, 64],   // Left Arm Right
    Left: [40, 52, 44, 64],    // Left Arm Left
    Top: [36, 48, 40, 52],     // Left Arm Top
    Bottom: [40, 48, 44, 52],  // Left Arm Bottom
    Front: [36, 52, 40, 64],   // Left Arm Front
    Back: [44, 52, 48, 64]     // Left Arm Back
  };
  const leftArmMaterials = createCubeMaterial(playerTexture, leftArmUV);
  const leftArm = new THREE.Mesh(leftArmGeometry, leftArmMaterials);
  leftArm.name = "LeftArm";
  leftArm.position.set(6 / 16, 12 / 16, 0); // Position to right side (from player's perspective)

  // Right Leg (4x12x4 pixels)
  const rightLegGeometry = new THREE.BoxGeometry(4 / 16, 12 / 16, 4 / 16, 1, 1, 1);
  const rightLegUV = {
    Right: [0, 20, 4, 32],     // Right Leg Right
    Left: [8, 20, 12, 32],     // Right Leg Left
    Top: [4, 16, 8, 20],       // Right Leg Top
    Bottom: [8, 16, 12, 20],   // Right Leg Bottom
    Front: [4, 20, 8, 32],     // Right Leg Front
    Back: [12, 20, 16, 32]     // Right Leg Back
  };
  const rightLegMaterials = createCubeMaterial(playerTexture, rightLegUV);
  const rightLeg = new THREE.Mesh(rightLegGeometry, rightLegMaterials);
  rightLeg.name = "RightLeg";
  rightLeg.position.set(0, -6 / 16, 0); // Position relative to pivot point

  // Create pivot group for right leg
  const rightLegPivot = new THREE.Group();
  rightLegPivot.name = "RightLegPivot";
  rightLegPivot.position.set(-2 / 16, 6 / 16, 0); // Pivot at top of leg
  rightLegPivot.add(rightLeg);

  // Left Leg (4x12x4 pixels) - Using 1.8+ skin format
  const leftLegGeometry = new THREE.BoxGeometry(4 / 16, 12 / 16, 4 / 16, 1, 1, 1);
  const leftLegUV = {
    Right: [16, 52, 20, 64],   // Left Leg Right
    Left: [24, 52, 28, 64],    // Left Leg Left
    Top: [20, 48, 24, 52],     // Left Leg Top
    Bottom: [24, 48, 28, 52],  // Left Leg Bottom
    Front: [20, 52, 24, 64],   // Left Leg Front
    Back: [28, 52, 32, 64]     // Left Leg Back
  };
  const leftLegMaterials = createCubeMaterial(playerTexture, leftLegUV);
  const leftLeg = new THREE.Mesh(leftLegGeometry, leftLegMaterials);
  leftLeg.name = "LeftLeg";
  leftLeg.position.set(0, -6 / 16, 0); // Position relative to pivot point

  // Create pivot group for left leg
  const leftLegPivot = new THREE.Group();
  leftLegPivot.name = "LeftLegPivot";
  leftLegPivot.position.set(2 / 16, 6 / 16, 0); // Pivot at top of leg
  leftLegPivot.add(leftLeg);

  group.add(head);
  group.add(body);
  group.add(rightArm);
  group.add(leftArm);
  group.add(rightLegPivot);
  group.add(leftLegPivot);

  scene.add(group);
  return group;
}
