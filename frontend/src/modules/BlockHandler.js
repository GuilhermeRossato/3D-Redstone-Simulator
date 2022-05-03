import SimplexNoise from "../libs/SimplexNoise.js";

export const FALLBACK_TEXTURE = 'unknown.png';

const noise = new SimplexNoise();

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
 * @param {number | 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back'} side
 * @param {number} x Optional block position to aid in random texture selection
 * @param {number} y
 * @param {number} z
 * @returns {string}
 */
export function getTextureFromBlock(blockData, side, x = 0, y = 0, z = 0) {
    if (!blockData.texture) {
        return null;
    }
    if (typeof blockData.texture === "string") {
        return blockData.texture;
    }
    if (blockData.texture instanceof Array) {
        const id = Math.floor((noise.noise4d(x, y, z, typeof side === 'number' ? side : getSideId(side)) + 1) * 1000) % blockData.texture.length;
        if (typeof blockData.texture[id] === "string") {
            return blockData.texture[id];
        }
        console.warn(`Invalid texture for side "${typeof side === 'number' ? getSideName(side) : side}" at index ${id} of "${blockData.name}"`);
        return FALLBACK_TEXTURE;
    }
    if (typeof blockData.texture === "object") {
        /** @type {Record<string, string | string[]>} */
        const texture = blockData.texture;
        const sideName = typeof side === 'number' ? getSideName(side) : side;
        if (!texture[sideName]) {
            console.warn(`No texture for side "${sideName}" of block "${blockData.name}"`);
            return FALLBACK_TEXTURE;
        }
        if (texture[sideName] instanceof Array) {
            const id = (noise.noise4d(x, y, z, typeof side === 'number' ? side : getSideId(side)) * 1000) % texture[sideName].length;
            if (typeof texture[sideName][id] === "string") {
                return texture[sideName][id];
            }
            console.warn(`Invalid texture for side "${sideName}" at index ${id} of "${blockData.name}"`);
            return FALLBACK_TEXTURE;
        }
        if (typeof texture[sideName] === 'string') {
            // @ts-ignore
            return texture[sideName];
        }
        console.warn(`Unhandled texture object type for side "${sideName}" of "${blockData.name}"`);
        return FALLBACK_TEXTURE;
    }
    console.warn(`Unhandled texture type for side "${typeof side === 'number' ? getSideName(side) : side}" of "${blockData.name}"`);
    return FALLBACK_TEXTURE;
}

export function getTextureListFromBlock(block) {
    if (!block.texture) {
        return [];
    }

    if (typeof block.texture === "string") {
        return [ block.texture ];
    }

    if (block.texture instanceof Array) {
        const result = [];
        for (let texture of block.texture) {
            if (typeof texture === "string") {
                result.push(texture);
            } else if (texture instanceof Array) {
                for (let subTexture of texture) {
                    if (typeof subTexture === "string") {
                        result.push(subTexture);
                    } else {
                        throw new Error(`Could not interpret sub texture of block "${block.name ?? block.id}"`);
                    }
                }
            } else {
                throw new Error(`Could not interpret sub texture of block "${block.name ?? block.id}"`);
            }
        }
        return result;
    }

    if (typeof block.texture === 'object') {
        return Object.values(block.texture);
    }

    throw new Error(`Could not interpret sub texture of block "${block.name ?? block.id}"`);
}