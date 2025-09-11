import * as THREE from '../../libs/three.module.js';
import * as WorldHandler from '../../world/WorldHandler.js';
import WorldBlock from '../../classes/world/WorldBlock.js';
import * as BlockHandler from '../../modules/BlockHandler.js';
import { getMaterial } from '../../modules/GraphicsHandler.js';
import SIDE_DISPLACEMENT from '../../data/SideDisplacement.js';
import * as TextureHandler from '../../modules/TextureHandler.js';
import BlockData from '../../data/LegacyBlockData.js';
import { g } from '../../utils/g.js';

const loadedChunks = [];

const primitive = new THREE.PlaneBufferGeometry(1, 1);

/** @type {Record<number, {id: number, rot: number}>} */
const redstoneTextureLookup = {
  0: { id: 0, rot: 446 },
  1: { id: 1, rot: 646 },
  2: { id: 1, rot: 646 },
  3: { id: 1, rot: 646 },
  4: { id: 1, rot: 446 },
  5: { id: 3, rot: 446 },
  6: { id: 3, rot: 646 },
  7: { id: 2, rot: 646 },
  8: { id: 1, rot: 446 },
  9: { id: 3, rot: 246 },
  10: { id: 3, rot: 846 },
  11: { id: 2, rot: 246 },
  12: { id: 1, rot: 446 },
  13: { id: 2, rot: 446 },
  14: { id: 2, rot: 846 },
  15: { id: 0, rot: 446 }
};



export default class Chunk {

  /**
   * @param {number} cx
   * @param {number} cy
   * @param {number} cz
   */
  constructor(cx, cy, cz) {
    this.cx = cx;
    this.cy = cy;
    this.cz = cz;

    /**
     * A record of z,x,y coordinates to block data objects.
     * Note: This structure is not optimized for performance, but for simplicity.
     * Note2: Each key is a relative position in the chunk, minimum is 0 and maximum is 15.
     * @type {{ [z: number]: { [x: number]: { [y: number]: WorldHandler.blockDefinitions } } }}
     */
    this.blocks = [];

    /** @type {WorldBlock[]} */
    this.blockList = [];

    /** @type {any | THREE.Mesh} */
    this.mesh = undefined;

    /**
     * Special block definitions of which the block id is negative.
     * @type {any[]}
     */
    this.definitions = null;
    
    this.rebuildMesh = this.rebuildMesh.bind(this);
  }

  /**
   * @param {THREE.Scene} scene
   */
  assignTo(scene) {
    if (!scene) {
      throw new Error('Cannot assign chunk to invalid scene');
    }
    this.scene = scene;
    if (this.blockList.length !== 0) {
      return this.requestMeshUpdate();
    }
    return null;
  }

  /**
   * @param {number} gx global position
   * @param {number} gy
   * @param {number} gz
   * @param {number} side
   */
  _getOcclusionId(gx, gy, gz, side) {
    let t, tr, r, br, b, bl, l, tl;
    const isSolidBlock = WorldHandler.isSolidBlock;

    if (side === 0) {
      t = isSolidBlock(gx, gy + 1, gz + 1);
      r = isSolidBlock(gx + 1, gy, gz + 1);
      b = isSolidBlock(gx, gy - 1, gz + 1);
      l = isSolidBlock(gx - 1, gy, gz + 1);
      tr = isSolidBlock(gx + 1, gy + 1, gz + 1);
      br = isSolidBlock(gx + 1, gy - 1, gz + 1);
      bl = isSolidBlock(gx - 1, gy - 1, gz + 1);
      tl = isSolidBlock(gx - 1, gy + 1, gz + 1);
    } else if (side === 1) {
      t = isSolidBlock(gx, gy + 1, gz - 1);
      r = isSolidBlock(gx - 1, gy, gz - 1);
      b = isSolidBlock(gx, gy - 1, gz - 1);
      l = isSolidBlock(gx + 1, gy, gz - 1);
      tr = isSolidBlock(gx - 1, gy + 1, gz - 1);
      br = isSolidBlock(gx - 1, gy - 1, gz - 1);
      bl = isSolidBlock(gx + 1, gy - 1, gz - 1);
      tl = isSolidBlock(gx + 1, gy + 1, gz - 1);
    } else if (side === 2) {
      t = isSolidBlock(gx + 1, gy + 1, gz);
      r = isSolidBlock(gx + 1, gy, gz - 1);
      b = isSolidBlock(gx + 1, gy - 1, gz);
      l = isSolidBlock(gx + 1, gy, gz + 1);
      tr = isSolidBlock(gx + 1, gy + 1, gz - 1);
      br = isSolidBlock(gx + 1, gy - 1, gz - 1);
      bl = isSolidBlock(gx + 1, gy - 1, gz + 1);
      tl = isSolidBlock(gx + 1, gy + 1, gz + 1);
    } else if (side === 3) {
      t = isSolidBlock(gx - 1, gy + 1, gz);
      r = isSolidBlock(gx - 1, gy, gz + 1);
      b = isSolidBlock(gx - 1, gy - 1, gz);
      l = isSolidBlock(gx - 1, gy, gz - 1);
      tr = isSolidBlock(gx - 1, gy + 1, gz + 1);
      br = isSolidBlock(gx - 1, gy - 1, gz + 1);
      bl = isSolidBlock(gx - 1, gy - 1, gz - 1);
      tl = isSolidBlock(gx - 1, gy + 1, gz - 1);
    } else if (side === 4) {
      t = isSolidBlock(gx, gy + 1, gz - 1);
      r = isSolidBlock(gx + 1, gy + 1, gz);
      b = isSolidBlock(gx, gy + 1, gz + 1);
      l = isSolidBlock(gx - 1, gy + 1, gz);
      tr = isSolidBlock(gx + 1, gy + 1, gz - 1);
      br = isSolidBlock(gx + 1, gy + 1, gz + 1);
      bl = isSolidBlock(gx - 1, gy + 1, gz + 1);
      tl = isSolidBlock(gx - 1, gy + 1, gz - 1);
    } else if (side === 5) {
      t = isSolidBlock(gx, gy - 1, gz + 1);
      r = isSolidBlock(gx + 1, gy - 1, gz);
      b = isSolidBlock(gx, gy - 1, gz - 1);
      l = isSolidBlock(gx - 1, gy - 1, gz);
      tr = isSolidBlock(gx + 1, gy - 1, gz + 1);
      br = isSolidBlock(gx + 1, gy - 1, gz - 1);
      bl = isSolidBlock(gx - 1, gy - 1, gz - 1);
      tl = isSolidBlock(gx - 1, gy - 1, gz + 1);
    } else {
      return 0;
    }
    // @ts-ignore
    return tl + t * 2 + tr * 4 + (r + (br + (b + (bl + l * 2) * 2) * 2) * 2) * 8;
  }

  getFaces(useCached = false, skipAo = false, skipFaceOcclusion = false, resetTextureFaces = false) {
    if (useCached && this._cachedFaces) {
      return this._cachedFaces;
    }
    /** @type {{ref: WorldBlock, x: number, y: number, z: number, rotationId: number, lightness: number, occlusionId: number, textureX: number, textureY: number, sideId: number}[]} */
    const faces = [];
    const get = WorldHandler.get;
    const textureRec = {};

    g("textureRec", textureRec);

    for (let i = this.blockList.length - 1; i >= 0; i--) {
      const block = this.blockList[i];
      
      const gx = this.cx * 16 + block.x;
      const gy = this.cy * 16 + block.y;
      const gz = this.cz * 16 + block.z;
      
      const sides = typeof block?.data?.faceCount === "number" ? block.data?.faceCount : 6;

      for (let j = 0; j < sides; j++) {
        // Face culling
        if (!skipFaceOcclusion) {
          if (block.data?.isSolid !== false) {
            const inverseBlock = get(gx + SIDE_DISPLACEMENT[j].inverse[0], gy + SIDE_DISPLACEMENT[j].inverse[1], gz + SIDE_DISPLACEMENT[j].inverse[2]);
            if (inverseBlock && inverseBlock.data?.isSolid !== false) {
              continue;
            }
          }
        }
        let faceTexture = textureRec[`${block.id}|${j}`];

        if (!faceTexture || faceTexture === BlockHandler.FALLBACK_TEXTURE || resetTextureFaces) {
          faceTexture = BlockHandler.getTextureFromBlock(block, j, gx, gy, gz);
          textureRec[`${block.id}|${j}`] = faceTexture;
        }
        
        let rotationId;
        if (block.data?.isRedstone) {
          const rightBlock = get(gx + 1, gy, gz);
          const rightAboveBlock = (!rightBlock || !rightBlock.data.isRedstone) ? get(gx + 1, gy + 1, gz) : null;
          const rightBelowBlock = !rightBlock ? get(gx + 1, gy - 1, gz) : null;

          const leftBlock = get(gx - 1, gy, gz);
          const leftAboveBlock = (!leftBlock || !leftBlock.data.isRedstone) ? get(gx - 1, gy + 1, gz) : null;
          const leftBelowBlock = !leftBlock ? get(gx - 1, gy - 1, gz) : null;

          const upBlock = get(gx, gy, gz - 1);
          const upAboveBlock = (!upBlock || !upBlock.data.isRedstone) ? get(gx, gy + 1, gz - 1) : null;
          const upBelowBlock = !upBlock ? get(gx, gy - 1, gz - 1) : null;

          const downBlock = get(gx, gy, gz + 1);
          const downAboveBlock = (!downBlock || !downBlock.data.isRedstone) ? get(gx, gy + 1, gz + 1) : null;
          const downBelowBlock = !downBlock ? get(gx, gy - 1, gz + 1) : null;

          const aboveBlock = get(gx, gy + 1, gz);

          const rRed = (rightBlock && rightBlock.data?.isRedstone) || (rightAboveBlock && rightAboveBlock.data?.isRedstone && !aboveBlock) || (rightBelowBlock && rightBelowBlock.data?.isRedstone);
          const lRed = (leftBlock && leftBlock.data?.isRedstone) || (leftAboveBlock && leftAboveBlock.data?.isRedstone && !aboveBlock) || (leftBelowBlock && leftBelowBlock.data?.isRedstone);
          const uRed = (upBlock && upBlock.data?.isRedstone) || (upAboveBlock && upAboveBlock.data?.isRedstone && !aboveBlock) || (upBelowBlock && upBelowBlock.data?.isRedstone);
          const dRed = (downBlock && downBlock.data?.isRedstone) || (downAboveBlock && downAboveBlock.data?.isRedstone && !aboveBlock) || (downBelowBlock && downBelowBlock.data?.isRedstone);
          const lookupId = (rRed ? 8 : 0) + (lRed ? 4 : 0) + (uRed ? 2 : 0) + (dRed ? 1 : 0);
          if (!redstoneTextureLookup[lookupId]) {
            faceTexture = BlockHandler.FALLBACK_TEXTURE;
            rotationId = 446;
            console.warn(`Unknown texture for ${lookupId} at`, gx, gy, gz);
          } else {
            faceTexture = block.data?.textureList[redstoneTextureLookup[lookupId].id];
            rotationId = redstoneTextureLookup[lookupId].rot;
          }
        } else {
          rotationId = SIDE_DISPLACEMENT[j].rotationId;
        }
        const { tx, ty } = TextureHandler.getTexturePositionFromName(faceTexture);
        const obj = {
          ref: block,
          sideId: j,
          x: block.x,
          y: block.y,
          z: block.z,
          rotationId,
          lightness: SIDE_DISPLACEMENT[j].lightness,
          occlusionId: (skipAo || block.data?.isRedstone) ? 0 : this._getOcclusionId(gx, gy, gz, j),
          textureX: tx,
          textureY: ty
        };
        if (block.data?.isRedstone) {
          obj.y -= 7.5 / 16;
        } else if (block.data?.isTorch && j !== 5) {
          obj.lightness = 1;
          obj[SIDE_DISPLACEMENT[j].originAxis] += SIDE_DISPLACEMENT[j].originValue * (j === 4 ? 2 : 1) / 16;
        } else {
          obj[SIDE_DISPLACEMENT[j].originAxis] += SIDE_DISPLACEMENT[j].originValue / 2;
        }
        faces.push(obj);
      }
    }
    this._cachedFaces = faces;
    return faces;
  }

  _buildMesh() {
    // console.log("Building chunk ", this.cx, this.cy, this.cz);
    if (this.mesh) {
      this.scene.remove(this.mesh);
      delete this.instanced.attributes.position;
      delete this.instanced.attributes.uv;
      this.instanced.index = null;

      this.instanced.dispose();
      this.mesh = null;
      this.instanced = null;
    }

    // const material = new THREE.MeshBasicMaterial();
    const material = getMaterial();

    const geometry = primitive;

    if (!material || !geometry) {
      console.warn("Could not generate chunk mesh because material or geometry are missing");
      return null;
    }

    /** @type {any} */
    const instanced = new THREE.InstancedBufferGeometry();

    instanced.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      28
    );

    instanced.attributes.position = geometry.attributes.position;
    instanced.attributes.uv = geometry.attributes.uv;
    instanced.index = geometry.index;

    const faces = this.getFaces(false, false, false, TextureHandler.flags.resetTextures);
    TextureHandler.flags.resetTextures = false;
    const faceCount = faces.length;

    if (faceCount === 0) {
      return null;
    }

    // instanced.setDrawRange(0, faceCount + 3);

    const arrayPos = new Float32Array(faceCount * 3);
    const arrayVisual = new Float32Array(faceCount * 3);
    const arrayTile = new Float32Array(faceCount * 2);

    let i1 = 0, i2 = 0, i3 = 0;
    for (let i = faces.length - 1; i >= 0; i--) {
      arrayPos[i1++] = faces[i].x;
      arrayPos[i1++] = faces[i].y;
      arrayPos[i1++] = faces[i].z;
      arrayVisual[i2++] = faces[i].rotationId;
      arrayVisual[i2++] = faces[i].lightness;
      arrayVisual[i2++] = faces[i].occlusionId;
      arrayTile[i3++] = faces[i].textureX;
      arrayTile[i3++] = faces[i].textureY;
    }

    const attributePos = new THREE.InstancedBufferAttribute(arrayPos, 3);
    instanced.setAttribute("instancePosition", attributePos);

    const attributeRotation = new THREE.InstancedBufferAttribute(arrayVisual, 3);
    instanced.setAttribute("instanceVisual", attributeRotation);

    const attributeTile = new THREE.InstancedBufferAttribute(arrayTile, 2);
    instanced.setAttribute("instanceTile", attributeTile);

    /** @type {any} */ // @ts-ignore
    const mesh = new THREE.Mesh(instanced, material);
    g("mesh", mesh);
    mesh.name = `${this.cx}x${this.cy}x${this.cz}`;
    mesh.position.set(this.cx * 16, this.cy * 16, this.cz * 16);

    this.instanced = instanced;
    this.mesh = mesh;
    if (!loadedChunks.includes(this)) {
      loadedChunks.push(this);
    }
    return mesh;
  }

  requestMeshUpdate() {
    const parent = this.scene;
    if (!parent) {
      return null;
    }
    if (!this.willRebuildMesh) {
      this.willRebuildMesh = true;
      this.updateMeshTimer = setTimeout(this.rebuildMesh, WorldHandler.blockDefinitions?Math.floor(1+Math.random()*30):100+Math.floor(Math.random()*300));
      // debug instant rebuild mesh on request - this.rebuildMesh();
    }
    // debug auto update mesh - setTimeout(() => this.requestMeshUpdate(), 500);
  }

  rebuildMesh() {
    this.willRebuildMesh = false;
    if (this.updateMeshTimer) {
      this.updateMeshTimer = null;
    }
    const parent = this.scene;
    if (!parent) {
      return null;
    }
    const mesh = this._buildMesh();
    if (!mesh) {
      return;
    }
    // @ts-ignore
    parent.add(mesh);
    return mesh;
  }

  /**
   * @param {number|string} x Relative block position
   * @param {number|string} y
   * @param {number|string} z
   * @param {number} id
   */
  set(x, y, z, id) {
    if ((typeof x === 'number'&&x < 0) || (typeof y === 'number' && y < 0) || (typeof z === 'number' && z < 0)) {
      throw new Error(`Local chunk position for setting is outside (${x},${y},${z}) of the chunk buffer`);
    }
    if ((typeof x === 'number'&&x >= 16) || (typeof y === 'number' && y >= 16) || (typeof z === 'number' && z >= 16)) {
      throw new Error(`Local chunk position for setting is outside (${x},${y},${z}) of the chunk buffer`);
    }
    const r = (window["blockRec"]||(window["blockRec"]={}));
    r[id] = (r[id]||0)+1;
    let changed = 0;
    if (id === 0) {
      this.clearBlock(x, y, z);
      changed = 1;
    } else if (this.blocks[z] && this.blocks[z][x] && this.blocks[z][x][y]) {
      if (Object.keys(WorldHandler.blockDefinitions).length && !WorldHandler.blockDefinitions[id]) {
        throw new Error(`Block id ${id} does not exist on WorldHandler.blockDefinitions`);
      }
      this.replaceBlock(x, y, z, id);
      changed = 1;
    } else {
      if (Object.keys(WorldHandler.blockDefinitions).length && !WorldHandler.blockDefinitions[id]) {
        throw new Error(`Block id ${id} does not exist on WorldHandler.blockDefinitions`);
      }
      this.addBlock(x, y, z, id);
      changed = 1;
    }
    this.requestMeshUpdate();
    return changed;
  }

  /**
   * @param {number} x Relative block position
   * @param {number} y
   * @param {number} z
   */
  get(x, y, z) {
    return this.blocks[z] && this.blocks[z][x] ? this.blocks[z][x][y] : null;
  }

  /**
   * @param {number | string} x Relative block position
   * @param {number | string} y
   * @param {number | string} z
   */
  clearBlock(x, y, z) {
    if (!this.blocks[z] || !this.blocks[z][x] || !this.blocks[z][x][y]) {
      return;
    }
    const index = this.blockList.indexOf(this.blocks[z][x][y]);
    if (index === -1) {
      console.warn("Can't clear block because it wasn't found in the chunk block list, but is at the block tree");
      return;
    }

    this.blockList.splice(index, 1);
    this.blocks[z][x][y] = null;
  }

  /**
   * @param {number | string} x Relative block position
   * @param {number | string} y 
   * @param {number | string} z 
   * @param {number} id 
   */
  replaceBlock(x, y, z, id) {
    this.blocks[z][x][y].id = id;
    this.blocks[z][x][y].data = WorldHandler.blockDefinitions[id];
    this.blocks[z][x][y].texture = WorldHandler.blockDefinitions[id].texture;
  }

  /**
   * @param {number|string} x Relative block position
   * @param {number|string} y 
   * @param {number|string} z 
   * @param {number|any} id 
   */
  addBlock(x, y, z, id) {
    const def = WorldHandler.blockDefinitions?.[id];
    const blockObj = {
      id,
      data: WorldHandler.blockDefinitions[id],
      x: typeof x === 'number' ? x : parseInt(x),
      y: typeof y === 'number' ? y : parseInt(y),
      z: typeof z === 'number' ? z : parseInt(z),
      texture: null,
    };
    if (def.textures instanceof Array && def.textures.length === 1) {
      blockObj.texture = def.textures[0];
    }
    if (def.data && def.data.textures instanceof Array && def.data.textures.length === 1) {
      blockObj.texture = def.data.textures[0];
    }
    if (def.data && def.data.texture && typeof def.data.texture === 'string') {
      blockObj.texture = def.data.texture;
    }
    if (!blockObj.texture) {
      blockObj.texture = BlockHandler.FALLBACK_TEXTURE;
    }
    if (!this.blocks[z]) {
      this.blocks[z] = [];
    }
    if (!this.blocks[z][x]) {
      this.blocks[z][x] = [];
    }
    this.blocks[z][x][y] = blockObj;
    this.blockList.push(blockObj);
  }
  
  /**
   * @unused
   * Extracts a packet position (16 bits) into a global position plus some metadata
   * @param {Int16Array} array The packed array.
   * @param {number} index The packed position.
   * @returns {[number, number, number, boolean, boolean, boolean, boolean]} The global position as [x, y, z], plus some flags.
   */
  _unpackGlobalPosition(array, index = 0) {
    const v = array[index];
    const [isSolid, isCollidable, isCustom, isProtected] = [
      (v & 0x1000) !== 0,
      (v & 0x2000) !== 0,
      (v & 0x4000) !== 0,
      (v & 0x8000) !== 0
    ];
    const x = (v >> 8) & 0xF;
    const y = (v >> 4) & 0xF;
    const z = v & 0xF;
    return [
      this.cx * 16 + x,
      this.cy * 16 + y,
      this.cz * 16 + z,
      isSolid,
      isCollidable,
      isCustom,
      isProtected,
    ];
  }

  /**
   * @unused
   * Packs a global position into a 16-bit packet position with metadata.
   * @param {number} gx Global x position.
   * @param {number} gy Global y position.
   * @param {number} gz Global z position.
   * @param {boolean} isSolid Whether the block is solid.
   * @param {boolean} isCollidable Whether the block is collidable.
   * @param {boolean} isCustom Whether the block is custom.
   * @param {boolean} isProtected Whether the block is protected.
   * @returns {number} The packed position that fits in 16 bits.
   */
  _packGlobalPosition(gx, gy, gz, isSolid = false, isCollidable = false, isCustom = false, isProtected = false) {
    const x = gx - this.cx * 16;
    const y = gy - this.cy * 16;
    const z = gz - this.cz * 16;
    if (x < 0 || x > 15 || y < 0 || y > 15 || z < 0 || z > 15) {
      throw new Error(`Global position (${gx}, ${gy}, ${gz}) is out of bounds for this chunk.`);
    }
    return (x << 8) |
    (y << 4) |
    z |
    (isSolid ? 0x1000 : 0) |
    (isCollidable ? 0x2000 : 0) |
    (isCustom ? 0x4000 : 0) |
    (isProtected ? 0x8000 : 0);
  }


}