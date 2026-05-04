import { getTextureListFromBlock, FALLBACK_TEXTURE } from './BlockHandler.js';
import * as THREE from '../libs/three.module.js';
import * as GraphicsHandler from "./GraphicsHandler.js";
import * as WorldHandler from "../world/WorldHandler.js";
import { sleep } from '../utils/sleep.js';


export const flags = {
  resetTextures: false,
  hasLoaded: false,
  pendingMeshUpdates: [],
}


/** @type {Record<string, {tx: number; ty: number; path: string; image: HTMLImageElement}>} */
let textureLookup = {};

let mainTexture, aoTexture;

/**
 * @param {string} filePath
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(filePath, img = new Image()) {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      reject(new Error("File path is required to load image"));
      return;
    }
    if (!filePath.startsWith("/3D-Redstone-Simulator/")) {
      reject(new Error(`File path must start with '/3D-Redstone-Simulator/', got: ${JSON.stringify(filePath)}`));
      return;
    }
    img.onload = resolve.bind(this, img);
    img.onerror = reject.bind(this, new Error(`Could not load asset "${filePath}"`));
    img.src = filePath;
  });
}

/**
 * @param {Record<string, {tx: number; ty: number; path: string; image: HTMLImageElement}>} textureLookup
 * @param {{width: number, height: number}} sizes
 */
function generateCanvasFromLookup(textureLookup, sizes) {
  const canvas = document.createElement("canvas");
  canvas.width = sizes.width;
  canvas.height = sizes.height;
  const ctx = canvas.getContext("2d");
  for (let filename in textureLookup) {
    const imageData = textureLookup[filename];
    ctx.drawImage(imageData.image, 0, 0, 16, 16, imageData.tx * 16, imageData.ty * 16, 16, 16);
  }
  return canvas;
}

/**
 * @param {HTMLCanvasElement} target
 * @param {HTMLCanvasElement | HTMLImageElement} origin
 */
function copyToCanvasWithMargin(target, origin) {
  const ctx = target.getContext("2d");
  let dx, dy;
  for (let y = target.height - 16; y >= 0; y -= 16) {
    for (let x = target.width - 16; x >= 0; x -= 16) {
      dx = x + 1 + (x / 16 | 0) * 2;
      dy = y + 1 + (y / 16 | 0) * 2;
      if (x >= target.width || y >= target.height) {
        continue;
      }
      ctx.drawImage(origin, x, y, 16, 16, dx, dy, 16, 16);
      ctx.drawImage(target, dx, dy, 16, 1, dx - 1, dy - 1, 18, 1);
      ctx.drawImage(target, dx, dy, 1, 16, dx - 1, dy - 1, 1, 18);
      ctx.drawImage(target, dx, dy + 15, 16, 1, dx - 1, dy + 15 + 1, 18, 1);
      ctx.drawImage(target, dx + 15, dy, 1, 16, dx + 15 + 1, dy - 1, 1, 18);
    }
  }
}

const loader = new THREE.TextureLoader();
/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<THREE.Texture>}
 */
function createTextureFromCanvas(canvas) {
  const dataUrl = canvas.toDataURL();
  return new Promise((resolve, reject) =>
    loader.load(
      dataUrl,
      resolve,
      undefined,
      (err) => {
        console.log('Loader error', err);
        reject(new Error("Could not load asset"))
      }
    )
  );
}

function createCanvas(width, height, addCanvasToScreen = false) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      if (addCanvasToScreen) {
        const styles = [
          "display: block",
          "position: absolute",
          "z-index: 100",
          `width: ${width * 3}px`,
          "image-rendering: optimizeSpeed",
          "image-rendering: pixelated"
        ];
        canvas.setAttribute("style", styles.join("; "));
        document.body.appendChild(canvas);
      }
      resolve(canvas);
    } catch (err) {
      console.error(`Failed to create canvas of size ${width}x${height}:`, err);
      reject(err);
    }
  });
}

async function processImageAndGenerateTextureFromPath(sourcePath, addCanvasToScreen = false) {
  const image = await loadImage(sourcePath);
  const canvas = await createCanvas(image.width, image.height, addCanvasToScreen);
  await copyToCanvasWithMargin(canvas, image);
  return await createTextureFromCanvas(canvas);
}

export async function unloadTextures() {
  if (!flags.hasLoaded) {
    return;
  }

  textureLookup = {};
  mainTexture = undefined;
  aoTexture = undefined;
  flags.hasLoaded = false;
}

export async function loadTextures() {
  try {
    // Unload existing textures if needed
    await unloadTextures();

    const textures = new Set([FALLBACK_TEXTURE]);
    const defs = Object.values(WorldHandler.blockDefinitions);
    for (const block of defs) {
      const name = String(block.name || block.key).toLowerCase();
      if (!block || !block.id || name === 'air') {
        continue;
      }
      if (!block.textures || !(block.textures instanceof Array)) {
        console.warn(`Block ${name} has no textures array`, block);
        continue;
      }
      if (!block.textures.length) {
        continue;
      }
      for (const texture of block.textures) {
        if (!texture || typeof texture !== 'string') {
          console.warn(`Block ${name} has invalid texture entry`, texture);
          continue;
        }
        textures.add(texture);
      }
    }
    const promises = [];
    let tx = 0;
    let ty = 0;
    for (let filename of textures) {
      if (textureLookup[filename]) {
        // Texture is already loaded, likely shared on another face
        continue;
      }
      const path = `/3D-Redstone-Simulator/frontend/assets/textures/${filename}`;
      const img = new Image();
      const promise = loadImage(path, img);
      promises.push(promise);
      textureLookup[filename] = {
        tx,
        ty,
        path,
        image: img,
      };
      tx++;
      if (tx >= 7) {
        tx = 0;
        ty++;
        if (ty >= 8) {
          // Soft error because this is bound to happen one day
          console.error('Texture buffer overflow');
          break;
        }
      }
    }

    await Promise.all(promises);

    const gridCanvas = generateCanvasFromLookup(textureLookup, {
      width: 16 * 8,
      height: 16 * 8
    });
    const newCanvas = document.createElement("canvas");
    newCanvas.width = gridCanvas.width;
    newCanvas.height = gridCanvas.height;
    copyToCanvasWithMargin(newCanvas, gridCanvas);

    mainTexture = await createTextureFromCanvas(newCanvas);
    mainTexture.wrapS = THREE.RepeatWrapping;
    mainTexture.wrapT = THREE.RepeatWrapping;
    mainTexture.magFilter = THREE.NearestFilter;
    mainTexture.minFilter = THREE.LinearFilter;

    aoTexture = await processImageAndGenerateTextureFromPath("/3D-Redstone-Simulator/frontend/assets/ambient-occlusion.png", false);
    aoTexture.wrapS = THREE.RepeatWrapping;
    aoTexture.wrapT = THREE.RepeatWrapping;
    aoTexture.magFilter = THREE.NearestFilter;
    aoTexture.minFilter = THREE.LinearFilter;

    flags.hasLoaded = true;
    flags.resetTextures = true;

    await GraphicsHandler.createBlockMaterial();
    console.log("Textures loaded successfully");
    await sleep(100); // Allow some time for textures to be used in mesh generation
    
    if (flags.pendingMeshUpdates && flags.pendingMeshUpdates.length > 0) {
      console.log("Processing pending mesh updates after texture load...");
      flags.pendingMeshUpdates.forEach(chunk => {
        chunk.parent = GraphicsHandler.scene;
        console.log(`Requesting mesh update for chunk ${chunk.cx},${chunk.cy},${chunk.cz} after texture load`);
        chunk.requestMeshUpdate();
      });
      flags.pendingMeshUpdates = null;
    }
    

  } catch (error) {
    console.error("Failed to load textures:", error);
    throw error;
  }
}

export async function load() {
  if (flags.hasLoaded) {
    throw new Error('Textures are already loaded');
  }

  await loadTextures();
}

export function getMainTexture() {
  if (!flags.hasLoaded) {
    throw new Error("Texture system not loaded");
  }
  return mainTexture;
}

export function getAoTexture() {
  if (!flags.hasLoaded) {
    throw new Error("Texture system not loaded");
  }
  return aoTexture;
}

export function getTexturePositionFromName(textureName) {
  return textureLookup[textureName] || textureLookup[FALLBACK_TEXTURE];
}

// For debug
window['TextureHandler'] = {
  load,
  getMainTexture,
  getAoTexture,
  getTexturePositionFromName,
};

