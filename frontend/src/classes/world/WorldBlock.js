import BlockData from "../../data/BlockData.js";

export default class WorldBlock {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} id
     * @param {string | string[] | string[][]} texture
     */
    constructor(x, y, z, id, texture) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.id = id;
        this.data = BlockData[id];
        this.texture = texture;
    }
}