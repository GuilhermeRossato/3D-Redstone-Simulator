import { noise4d } from "../libs/SimplexNoise.js";

function getReproduciblyRandomAvailableTexture(sideNumber, x, y, z) {
	return this.textureList[Math.abs(Math.floor((noise4d(x, y, z, sideNumber) * 1000))) % this.textureList.length];
}

window['getReproduciblyRandomAvailableTexture'] = getReproduciblyRandomAvailableTexture;

// Legacy BlockData for reference/cache - keeping sample blocks for compatibility
const legacyBlockData = [{
	name: "Air"
}, {
	name: "Stone",
	texture: getReproduciblyRandomAvailableTexture,
	textureList: ["stone0.png", "stone1.png", "stone2.png", "stone3.png", "stone4.png", "stone5.png", "stone6.png", "stone7.png"]
}, {
	name: "Wooden Planks",
	texture: "plank.png"
}, {
	name: "Stone Brick",
	texture: "stonebrick.png"
}, {
	name: "Smooth Standstone",
	texture: getReproduciblyRandomAvailableTexture,
	textureList: ["sandstone0.png", "sandstone1.png", "sandstone2.png", "sandstone3.png"]
}, {
	name: "Redstone Dust",
	faceCount: 1,
	isSolid: false,
	isRedstone: true,
	texture: "redstone-full-off.png",
	textureList: ["redstone-full-off.png", "redstone-line-off.png", "redstone-intersection-off.png", "redstone-corner-off.png"]
}, {
	name: "Redstone Dust",
	faceCount: 1,
	isSolid: false,
	isRedstone: true,
	texture: "redstone-full-on.png",
	textureList: ["redstone-full-on.png", "redstone-line-on.png", "redstone-intersection-on.png", "redstone-corner-on.png"]
}, {
	name: "Redstone Torch Off",
	isTorch: true,
	isSolid: false,
	texture: {
        top: 'redstone-torch-top-off.png',
        bottom: 'redstone-torch-bottom.png',
        left: 'redstone-torch-off.png',
        right: 'redstone-torch-off.png',
        front: 'redstone-torch-off.png',
        back: 'redstone-torch-off.png',
	}
}, {
	name: "Redstone Torch On",
	faceCount: 5,
	isTorch: true,
	isSolid: false,
	texture: {
        top: 'redstone-torch-top-on.png',
        bottom: 'redstone-torch-bottom.png',
        left: 'redstone-torch-on.png',
        right: 'redstone-torch-on.png',
        front: 'redstone-torch-on.png',
        back: 'redstone-torch-on.png',
	}
}];

// New network-based BlockData format
const BlockData = {
  "1": {
    "data": {
      "texture": [
        "stone0.png"
      ],
      "hardness": 1.5,
      "blast_resistance": 6,
      "loaded": 1752231148543
    },
    "key": "STONE",
    "id": 1
  },
  "2": {
    "data": {
      "texture": "copper_ore.png",
      "loaded": 1752231148544
    },
    "key": "COPPER_ORE",
    "id": 2
  },
  "3": {
    "data": {
      "texture": "water_still.png",
      "loaded": 1752231148544
    },
    "key": "WATER",
    "id": 3
  },
  "4": {
    "data": {
      "key": "GRANITE",
      "texture": "granite.png",
      "loaded": 1752231148545
    },
    "key": "GRANITE",
    "id": 4
  },
  "5": {
    "data": {
      "texture": [
        "grass_path_top.png",
        "grass_path_side.png",
        "dirt.png"
      ],
      "hardness": 0.6,
      "name": "Grass Block",
      "id": 2,
      "type": "block",
      "is_solid": true,
      "is_transparent": false,
      "is_opaque": true,
      "is_flammable": false,
      "is_mineable_with_shovel": true,
      "is_mineable_with_pickaxe": false,
      "is_mineable_with_axe": false,
      "is_mineable_with_hoe": false,
      "loaded": 1752231148545
    },
    "key": "GRASS_BLOCK",
    "id": 5
  },
  "6": {
    "data": {
      "texture": "oak_log.png",
      "loaded": 1752231148546
    },
    "key": "OAK_LOG",
    "id": 6
  },
  "7": {
    "data": {
      "texture": "unknown.png",
      "loaded": 1752231148547
    },
    "key": "SHORT_GRASS",
    "id": 7
  },
  "8": {
    "data": {
      "texture": "oak_leaves.png",
      "loaded": 1752231148548
    },
    "key": "OAK_LEAVES",
    "id": 8
  },
  "9": {
    "data": {
      "key": "BIRCH_LOG",
      "texture": "birch_log.png",
      "loaded": 1752231148548
    },
    "key": "BIRCH_LOG",
    "id": 9
  },
  "10": {
    "data": {
      "texture": "unknown.png",
      "loaded": 1752231148548
    },
    "key": "BIRCH_LEAVES",
    "id": 10
  },
  "11": {
    "data": {
      "key": "DIRT",
      "texture": "dirt.png",
      "loaded": 1752231148549
    },
    "key": "DIRT",
    "id": 11
  },
  "12": {
    "data": {
      "key": "ACACIA_LEAVES",
      "texture": "acacia_leaves.png",
      "loaded": 1752231148549
    },
    "key": "ACACIA_LEAVES",
    "id": 12
  },
  "13": {
    "data": {
      "key": "ANDESITE",
      "texture": "andesite.png",
      "loaded": 1752231148549
    },
    "key": "ANDESITE",
    "id": 13
  },
  "14": {
    "data": {
      "texture": "unknown.png",
      "loaded": 1752231148549
    },
    "key": "GLOW_LICHEN",
    "id": 14
  },
  "15": {
    "data": {
      "texture": "unknown.png",
      "loaded": 1752231148549
    },
    "key": "DIORITE",
    "id": 15
  },
  "16": {
    "data": {
      "key": "GRAVEL",
      "texture": "gravel.png",
      "loaded": 1752231148550
    },
    "key": "GRAVEL",
    "id": 16
  },
  "17": {
    "data": {
      "key": "JUNGLE_LEAVES",
      "texture": "jungle_leaves.png",
      "loaded": 1752231148551
    },
    "key": "JUNGLE_LEAVES",
    "id": 17
  },
  "18": {
    "data": {
      "key": "VINE",
      "texture": "vine.png",
      "loaded": 1752231148551
    },
    "key": "VINE",
    "id": 18
  },
  "19": {
    "data": {
      "texture": "unknown.png",
      "loaded": 1752231148551
    },
    "key": "COAL_ORE",
    "id": 19
  },
  "20": {
    "data": {
      "texture": [
        "jungle_log.png",
        "jungle_log_top.png"
      ],
      "hardness": 2,
      "resistance": 5,
      "flammable": true,
      "flammability": 5,
      "burns": true,
      "tool": "axe",
      "tool_level": 0,
      "transparent": false,
      "solid": true,
      "opaque": true,
      "collision_box": {
        "type": "block",
        "size": [
          1,
          1,
          1
        ]
      },
      "light_emission": 0,
      "loaded": 1752231148552
    },
    "key": "JUNGLE_LOG",
    "id": 20
  },
  "21": {
    "data": {
      "key": "FERN",
      "texture": "fern.png",
      "loaded": 1752231148552
    },
    "key": "FERN",
    "id": 21
  },
  "22": {
    "data": {
      "key": "IRON_ORE",
      "texture": "iron_ore.png",
      "loaded": 1752231148552
    },
    "key": "IRON_ORE",
    "id": 22
  },
  "23": {
    "data": {
      "key": "DANDELION",
      "texture": "dandelion.png",
      "loaded": 1752231148552
    },
    "key": "DANDELION",
    "id": 23
  }
};

// Utility functions for the new format
export function getBlockData(blockId) {
  return BlockData[blockId.toString()];
}

export function getBlockTexture(blockId) {
  const block = getBlockData(blockId);
  if (!block || !block.data) return null;
  return block.data.texture;
}

export function getBlockName(blockId) {
  const block = getBlockData(blockId);
  if (!block) return "Unknown";
  return block.data?.name || block.key || "Unknown";
}

export function isBlockSolid(blockId) {
  const block = getBlockData(blockId);
  if (!block || !block.data) return true;
  return block.data.is_solid !== false && block.data.solid !== false;
}

// Legacy compatibility adapter for files still using array-style access
export function createLegacyAdapter(blockId) {
  const blockData = getBlockData(blockId);
  if (!blockData) return { name: "Air" };
  
  return {
    name: getBlockName(blockId),
    texture: getBlockTexture(blockId),
    isSolid: isBlockSolid(blockId),
    // Map other legacy properties as needed
    faceCount: blockData.data?.faceCount,
    isRedstone: blockData.data?.isRedstone,
    isTorch: blockData.data?.isTorch,
    textureList: Array.isArray(blockData.data?.texture) ? blockData.data.texture : [blockData.data?.texture].filter(Boolean)
  };
}

// Add a migration helper function that can be used by other files to maintain compatibility
export function migrateToNewFormat() {
  // This function helps migrate old array-style usage to new object-style usage
  console.log('BlockData has been migrated to new network-based format');
  console.log('Use getBlockData(id), getBlockTexture(id), getBlockName(id), isBlockSolid(id) functions');
}

// For immediate backward compatibility, create a Proxy to handle array-like access
export const BlockDataLegacyProxy = new Proxy(BlockData, {
  get(target, prop) {
    // If it's a number, treat it as block ID and return legacy-compatible object
    if (typeof prop === 'string' && !isNaN(Number(prop)) && prop !== 'length') {
      const blockId = parseInt(prop);
      return createLegacyAdapter(blockId);
    }
    // Otherwise return the normal property
    return target[prop];
  },
  has(target, prop) {
    // Support checking if a block ID exists
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return target[prop] !== undefined;
    }
    return prop in target;
  }
});

export { legacyBlockData };
export default BlockData;
