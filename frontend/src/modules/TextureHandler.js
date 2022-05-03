import BlockData from '../data/BlockData.js';
import { getTextureListFromBlock, getTextureFromBlock, FALLBACK_TEXTURE } from './BlockHandler.js';
import * as THREE from '../libs/three.module.js';

let hasLoaded = false;

/** @type {Record<string, {tx: number; ty: number; path: string; image: HTMLImageElement}>} */
const textureLookup = {};

let mainTexture, aoTexture;

/**
 * @param {string} filename
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(filename) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.onload = resolve.bind(this, img);
        img.onerror = reject.bind(this, new Error(`Could not load asset "${filename}"`));
        img.src = filename;
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
            () => reject(new Error("Could not load asset"))
        )
    );
}

function createCanvas(width, height, addCanvasToScreen = false) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        if (addCanvasToScreen) {
            canvas.setAttribute("style", "display: block; position: absolute; z-index: 100; width: "+(width*3)+"px; image-rendering: optimizeSpeed; image-rendering: pixelated;");
            document.body.appendChild(canvas);
        }
        resolve(canvas);
    });
}

async function processImageAndGenerateTextureFromPath(sourcePath, addCanvasToScreen = false) {
    const image = await loadImage(sourcePath);
    const canvas = await createCanvas(image.width, image.height, addCanvasToScreen);
    await copyToCanvasWithMargin(canvas, image);
    return await createTextureFromCanvas(canvas);
}

async function load() {
    if (hasLoaded) {
        throw new Error('Textures are already loaded');
    }

    let textureFilenameList = [FALLBACK_TEXTURE];
    
    for (let block of BlockData) {
        if (block.name === 'Air') {
            continue;
        }
        const textureList = getTextureListFromBlock(block);
        if (!(textureList instanceof Array)) {
            throw new Error("Invalid texture list from block");
        }
        textureFilenameList.push(...textureList);
    }

    let tx = 0;
    let ty = 0;
    for (let filename of textureFilenameList) {
        if (textureLookup[filename]) {
            // Texture is already loaded, liekly shared in another face
            continue;
        }
        const path = 'assets/textures/' + filename;
        textureLookup[filename] = {
            tx,
            ty,
            path,
            image: await loadImage(path)
        }
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

    {
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
    }

    aoTexture = await processImageAndGenerateTextureFromPath("assets/ambient-occlusion.png", false);
    aoTexture.wrapS = THREE.RepeatWrapping;
    aoTexture.wrapT = THREE.RepeatWrapping;
    aoTexture.magFilter = THREE.NearestFilter;
    aoTexture.minFilter = THREE.LinearFilter;

    hasLoaded = true;
}

function getMainTexture() {
    if (!hasLoaded) {
        throw new Error("Texture system not loaded");
    }
    return mainTexture;
}

function getAoTexture() {
    if (!hasLoaded) {
        throw new Error("Texture system not loaded");
    }
    return aoTexture;
}

function getTexturePositionFromName(textureName) {
    return textureLookup[textureName] || textureLookup[FALLBACK_TEXTURE];
}

const TextureHandler = {
    load,
    getMainTexture,
    getAoTexture,
    getTexturePositionFromName,
};

export default TextureHandler;

