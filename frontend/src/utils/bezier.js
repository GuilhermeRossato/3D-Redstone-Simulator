/**
 * @param {number} i
 * @param {number} j
 * @param {number} t
 */
export function b(i, j, t) {
    if (typeof i !== 'number' || typeof j !== 'number' || isNaN(i) || isNaN(j) || isNaN(t) || i + j + t === Infinity) {
        throw new Error(`Invalid parameters: ${JSON.stringify([i, j, t])}`);
    }
    return i + (j - i) * t;
}


/**
 * @param {number} i
 * @param {number} j
 * @param {number} k
 */
export function ib(i, j, k) {
    if (typeof i !== "number" ||
        isNaN(i) ||
        typeof j !== "number" ||
        isNaN(j) ||
        typeof k !== "number" ||
        isNaN(k)) {
        throw new Error(`Invalid parameters: ${JSON.stringify({ i, j, k })}`);
    }
    if (j === i) {
        return 0;
    }
    return (k - i) / (j - i);
}

/**
 * Clamped bezier function
 * @param {number} i 
 * @param {number} j 
 * @param {number} t 
 * @returns 
 */
export function bc(i, j, t) {
    return t < 0 ? i : t > 1 ? j : b(i, j, t);
}

/**
 * Bezier function for vectors with output written to a THREE.Vector3 instance
 * @param {[number, number, number]} vec1 - First vector
 * @param {[number, number, number]} vec2 - Second vector
 * @param {number} t - Interpolation parameter (normalized)
 * @param {import("../libs/three.module.js").Vector3} [output] - THREE.Vector3 instance to write the result to
 */
export function bvToVector3(vec1, vec2, t, output) {
    if (!Array.isArray(vec1) || !Array.isArray(vec2) || vec1.length !== 3 || vec2.length !== 3 || typeof t !== 'number' || isNaN(t)) {
        throw new Error(`Invalid parameters: ${JSON.stringify({ vec1, vec2, t, output })}`);
    }
    if (!output?.set) {
      return { x: b(vec1[0], vec2[0], t), y: b(vec1[1], vec2[1], t), z: b(vec1[2], vec2[2], t) };
    }
    output.set(
        b(vec1[0], vec2[0], t),
        b(vec1[1], vec2[1], t),
        b(vec1[2], vec2[2], t)
    );
}

/**
 * Second-degree bezier function
 * @param {number} x0 - First x-coordinate
 * @param {number} x1 - Second x-coordinate
 * @param {number} x2 - Third x-coordinate
 * @param {number} y0 - First y-coordinate
 * @param {number} y1 - Second y-coordinate
 * @param {number} y2 - Third y-coordinate
 * @param {number} x - Interpolation x-coordinate
 * @param {number} t - Interpolation parameter
 * @returns {number} - Interpolated value
 */
export function secondDegreeBezier(x0, x1, x2, y0, y1, y2, x, t) {
    const ib0 = ib(x0, x1, x);
    const ib1 = ib(x1, x2, x);

    const b0 = b(y0, y1, ib0);
    const b1 = b(y1, y2, ib1);

    return b(b0, b1, t);
}
