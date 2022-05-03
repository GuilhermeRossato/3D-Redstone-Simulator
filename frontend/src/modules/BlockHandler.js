import { noise4d } from "../libs/SimplexNoise.js";

export const FALLBACK_TEXTURE = 'unknown.png';

/**
 * @param {'top' | 'bottom' | 'left' | 'right' | 'front' | 'back'} side
 */
function getSideId(side) {
    return ({
        'top': 0,
        'bottom': 1,
        'left': 2,
        'right': 3,
        'front': 4,
        'back': 5,
    }[side]);
}

/**
 * @param {number} side
 * @returns {'top' | 'bottom' | 'left' | 'right' | 'front' | 'back'}
 */
function getSideName(side) {
    return ({
        '0': 'left',
        '1': 'right',
        '2': 'front',
        '3': 'back',
        '4': 'top',
        '5': 'bottom',
    }[side]);
}

/**
 * @param {any} blockData
 * @param {number} sideNumber
 * @param {number} x Optional block position to aid in random texture selection
 * @param {number} y
 * @param {number} z
 * @returns {string}
 */
export function getTextureFromBlock(blockData, sideNumber, x = 0, y = 0, z = 0) {
    if (!blockData.data.texture) {
        return FALLBACK_TEXTURE;
    }
    
    if (typeof blockData.data.texture === "string") {
        return blockData.data.texture;
    }

    if (typeof blockData.data.texture === 'object') {
        const texture = blockData.data.texture;
        const sideName = getSideName(sideNumber);
        if (!texture[sideName]) {
            console.warn(`Missing texture for side "${sideName}" on block with object texture`);
            return FALLBACK_TEXTURE;
        }
    }

    if (blockData.data.texture instanceof Function) {
        if (!(blockData.data.textureList instanceof Array)) {
            throw new Error("Missing texture list on block with texture function for the list of textures that the function can return");
        }
        const texture = blockData.data.texture.call(blockData.data, sideNumber, x, y, z);
        if (blockData.data.textureList.includes(texture)) {
            return texture;
        } else {
            console.warn(`Texture list for side "${getSideName(sideNumber)}" (${sideNumber}) at ${x},${y},${z} returned a value out of the declared texture list options`);
            return FALLBACK_TEXTURE;
        }
    }

    console.warn("Invalid type of block data texture");
    return FALLBACK_TEXTURE;
}

export function getTextureListFromBlock(block) {
    if (block.textureList) {
        return block.textureList;
    }
    if (typeof block.texture === 'string') {
        return [block.texture];
    }
    if (typeof block.texture === 'object') {
        return [
            block.texture[getSideName(0)],
            block.texture[getSideName(1)],
            block.texture[getSideName(2)],
            block.texture[getSideName(3)],
            block.texture[getSideName(4)],
            block.texture[getSideName(5)],
        ];
    }
    console.warn("Texture list is empty and block is fully out of");
    return [];
}