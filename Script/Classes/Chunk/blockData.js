/* Block Types
0 : Normal 6 sided solid cube
1 : 2 diagonal faces, crossing each other (Saplings)
2 : 1 face, for redstone
*/

blockData = {
	"1": {
		texture: "stone.png"
	},
	"2": {
		texture: {
			top: "grass_green.png",
			left: "grass_side.png",
			right: "grass_side.png",
			front: "grass_side.png",
			back: "grass_side.png",
			bottom: "dirt.png"
		}
	},
	"3": {
		texture: "dirt.png"
	},
	"4": {
		texture: "cobblestone.png"
	},
	"5": {
		texture: "planks_oak.png",
		type: 1, // 2 diagonally faces, crossing each other
		transparent: true
	}
}

const block_data = [{
	id: 1,
	texture: "stone.png"
}, {
	id: 2,
	texture: {
		top: "grass_green.png",
		left: "grass_side.png",
		right: "grass_side.png",
		front: "grass_side.png",
		back: "grass_side.png",
		bottom: "dirt.png"
	}
}, {
	id: 3,
	texture: "dirt.png"
}, {
	id: 4,
	texture: "cobblestone.png"
}, {
	id: 5,
	texture: "planks_oak.png"
}, {
	id: 6,
	texture: "sapling_oak.png",
	special: true
}, {
	id: 7,
	texture: "bedrock.png"
}, {
	id: 12,
	texture: "sand.png"
}, {
	id: 13,
	texture: "gravel.png"
}, {
	id: 14,
	texture: "gold_ore.png"
}, {
	id: 15,
	texture: "iron_ore.png"
}, {
	id: 16,
	texture: "coal_ore.png"
}, {
	id: 17,
	texture: {
		top: "log_oak_top.png",
		left: "log_oak.png",
		right: "log_oak.png",
		front: "log_oak.png",
		back: "log_oak.png",
		bottom: "log_oak_top.png"
	}
}, {
	id: 18,
	texture: "leaves_oak_opaque.png"
}, {
	id: 19,
	texture: "sponge.png"
}, {
	id: 20,
	texture: "glass.png",
	special: true
}, {
	id: 21,
	texture: "lapis_ore.png"
}, {
	id: 22,
	texture: "lapis_block.png"
}, {
	id: 23,
	texture: {
		top: "furnace_top.png",
		left: "furnace_side.png",
		right: "furnace_side.png",
		front: "dispenser_front_horizontal.png",
		back: "furnace_side.png",
		bottom: "furnace_top.png"
	}
}, {
	id: 24,
	texture: {
		top: "sandstone_top.png",
		left: "sandstone_normal.png",
		right: "sandstone_normal.png",
		front: "sandstone_normal.png",
		back: "sandstone_normal.png",
		bottom: "sandstone_bottom.png"
	}
}, {
	id: 25,
	texture: "noteblock.png"
}, {
	id: 27,
	texture: "rail_golden_powered.png",
	special: true
}, {
	id: 28,
	texture: "rail_detector.png",
	special: true
}, {
	id: 29,
	texture: {
		top: "piston_top_sticky.png",
		left: "piston_side.png",
		right: "piston_side.png",
		front: "piston_side.png",
		back: "piston_side.png",
		bottom: "piston_bottom.png"
	}
}, {
	id: 33,
	texture: {
		top: "piston_top_normal.png",
		left: "piston_side.png",
		right: "piston_side.png",
		front: "piston_side.png",
		back: "piston_side.png",
		bottom: "piston_bottom.png"
	}
}, {
	id: 35,
	texture: "wool_colored_white.png"
}, {
	id: 41,
	texture: "gold_block.png"
}, {
	id: 42,
	texture: "iron_block.png"
}, {
	id: 43,
	texture: {
		top: "stone_slab_top.png",
		left: "stone_slab_side.png",
		right: "stone_slab_side.png",
		front: "stone_slab_side.png",
		back: "stone_slab_side.png",
		bottom: "stone_slab_top.png"
	}
}, {
	id: 45,
	texture: "brick.png"
}, {
	id: 46,
	texture: {
		top: "tnt_top.png",
		left: "tnt_side.png",
		right: "tnt_side.png",
		front: "tnt_side.png",
		back: "tnt_side.png",
		bottom: "tnt_bottom.png"
	}
}, {
	id: 47,
	texture: {
		top: "planks_oak.png",
		left: "bookshelf.png",
		right: "bookshelf.png",
		front: "bookshelf.png",
		back: "bookshelf.png",
		bottom: "planks_oak.png"
	}
}, {
	id: 48,
	texture: "cobblestone_mossy.png"
}, {
	id: 49,
	texture: "obsidian.png"
}, {
	id: 50,
	texture: "torch_on.png",
	special: true
}, {
	id: 56,
	texture: "diamond_ore.png"
}, {
	id: 57,
	texture: "diamond_block.png"
}, {
	id: 58,
	texture: {
		top: "crafting_table_top.png",
		left: "crafting_table_side.png",
		right: "crafting_table_side.png",
		front: "crafting_table_front.png",
		back: "crafting_table_front.png",
		bottom: "planks_oak.png"
	}
}, {
	id: 61,
	texture: {
		top: "furnace_top.png",
		left: "furnace_side.png",
		right: "furnace_side.png",
		front: "furnace_front_off.png",
		back: "furnace_side.png",
		bottom: "furnace_top.png"
	}
}, {
	id: 62,
	texture: "rail_normal.png",
	special: true
}, {
	id: 63,
	texture: "door_wood_upper.png",
	special: true
}, {
	id: 64,
	texture: "door_wood_lower.png",
	special: true
}, {
	id: 66,
	texture: "rail_normal.png",
	special: true
}, {
	// Sign Block (68)
	id: 68,
	texture: "rail_normal.png",
	special: true
}, {
	id: 69,
	texture: "lever.png",
	special: true
}, {
	// Stone Pressure Plate
	id: 70,
	texture: "stone.png",
	special: true
}, {
	id: 71,
	texture: "door_iron_lower.png",
	special: true
}, {
	id: 72,
	texture: "planks_oak.png",
	special: true
}, {
	id: 73,
	texture: "redstone_ore.png"
}, {
	id: 74,
	texture: "redstone_ore.png"
}, {
	id: 75,
	texture: "redstone_torch_off.png",
	special: true
}, {
	id: 76,
	texture: "redstone_torch_on.png",
	special: true
}, {
	id: 77,
	texture: "stone.png",
	special: true
}, {
	id: 78,
	texture: "snow.png"
}, {
	id: 79,
	texture: "ice.png"
}, {
	id: 80,
	texture: "snow.png"
}, {
	id: 81,
	texture: {
		top: "cactus_top.png",
		left: "cactus_side.png",
		right: "cactus_side.png",
		front: "cactus_side.png",
		back: "cactus_side.png",
		bottom: "cactus_bottom.png"
	},
	special: true
}, {
	id: 82,
	texture: "clay.png"
}, {
	id: 81,
	texture: {
		top: "pumpkin_top.png",
		left: "pumpkin_side.png",
		right: "pumpkin_side.png",
		front: "pumpkin_face_off.png",
		back: "pumpkin_face_on.png",
		bottom: "pumpkin_top.png"
	},
}, {
	id: 87,
	texture: "netherrack.png"
}, {
	id: 88,
	texture: "soul_sand.png"
}, {
	id: 89,
	texture: "glowstone.png"
}, {
	id: 93,
	texture: "repeater_off.png",
	special: true
}, {
	id: 94,
	texture: "repeater_on.png",
	special: true
}, {
	id: 95,
	texture: "trapdoor.png",
	special: true
}, {
	// Stone Brick (98)
	id: 98,
	texture: "stonebrick.png"
}, {
	id: 121,
	texture: "end_stone.png"
}, {
	id: 149,
	texture: "comparator_off.png",
	special: true
}, {
	id: 150,
	texture: "comparator_on.png",
	special: true
}, {
	id: 155,
	texture: "quartz_block_top.png"
}, {
	id: 157,
	texture: "rail_activator.png",
	special: true
}, {
	// White Stained Clay (159)
	id: 159,
	texture: "hardened_clay_stained_white.png"
}, {
	// Orange Stained Clay (159:1)
	id: 160,
	texture: "hardened_clay_stained_orange.png"
}, {
	id: 161,
	texture: "hardened_clay_stained_magenta.png"
}, {
	id: 162,
	texture: "hardened_clay_stained_light_blue.png"
}, {
	id: 163,
	texture: "hardened_clay_stained_yellow.png"
}, {
	id: 164,
	texture: "hardened_clay_stained_lime.png"
}, {
	id: 165,
	texture: "hardened_clay_stained_pink.png"
}, {
	id: 166,
	texture: "hardened_clay_stained_gray.png"
}, {
	id: 167,
	texture: "hardened_clay_stained_silver.png"
}, {
	id: 168,
	texture: "hardened_clay_stained_cyan.png"
}, {
	id: 169,
	texture: "hardened_clay_stained_purple.png"
}, {
	// Hay Bale (170)
	id: 170,
	texture: {
		top: "hay_block_top.png",
		left: "hay_block_side.png",
		right: "hay_block_side.png",
		front: "hay_block_side.png",
		back: "hay_block_side.png",
		bottom: "hay_block_top.png"
	}
}, {
	// Black Stained Clay (159:11)
	id: 171,
	texture: "hardened_clay_stained_blue.png"
}, {
	// Hardened Clay (172)
	id: 172,
	texture: "hardened_clay.png"
}, {
	id: 173,
	texture: "coal_block.png"
}, {
	// Brown Stained Clay (159:12)
	id: 174,
	texture: "hardened_clay_stained_brown.png"
}, {
	id: 175,
	texture: "hardened_clay_stained_green.png"
}, {
	id: 176,
	texture: "hardened_clay_stained_red.png"
}, {
	// Black Stained Clay (159:15)
	id: 177,
	texture: "hardened_clay_stained_black.png"
}, {
	// Spruce Wood Plank (5:1)
	id: 178,
	texture: "planks_spruce.png"
}, {
	// Birch Wood Plank (5:2)
	id: 179,
	texture: "planks_birch.png"
}, {
	// Jungle Wood Plank (5:3)
	id: 180,
	texture: "planks_jungle.png"
}, {
	// Acacia Wood Plank (5:4)
	id: 181,
	texture: "planks_acacia.png"
}, {
	// Dark Oak Wood Plank (5:5)
	id: 182,
	texture: "planks_big_oak.png"
}, {
	// Mossy Stone Bricks (98:1)
	id: 183,
	texture: "stonebrick_mossy.png"
}, {
	// Cracked Stone Bricks (98:2)
	id: 184,
	texture: "stonebrick_cracked.png"
}, {
	// Chiseled Stone Bricks (98:3)
	id: 185,
	texture: "stonebrick_carved.png"
}, {
	// Orange Wool (35:1)
	id: 186,
	texture: "wool_colored_orange.png"
}, {
	id: 187,
	texture: "wool_colored_magenta.png"
}, {
	id: 188,
	texture: "wool_colored_light_blue.png"
}, {
	id: 189,
	texture: "wool_colored_yellow.png"
}, {
	id: 190,
	texture: "wool_colored_lime.png"
}, {
	id: 191,
	texture: "wool_colored_pink.png"
}, {
	id: 192,
	texture: "wool_colored_gray.png"
}, {
	id: 193,
	texture: "wool_colored_silver.png"
}, {
	id: 194,
	texture: "wool_colored_cyan.png"
}, {
	id: 195,
	texture: "wool_colored_purple.png"
}, {
	id: 196,
	texture: "wool_colored_blue.png"
}, {
	id: 197,
	texture: "wool_colored_brown.png"
}, {
	id: 198,
	texture: "wool_colored_green.png"
}, {
	id: 199,
	texture: "wool_colored_red.png"
}, {
	// Black Wool (35:15)
	id: 200,
	texture: "wool_colored_black.png"
}, {
	id: 201,
	texture: "redstone_lamp_off.png"
}, {
	id: 202,
	texture: "redstone_lamp_on.png"
}, {
	// Bottom Stone Slab (44:1)
	id: 203,
	texture: {
		top: "stone_slab_top.png",
		left: "stone_slab_half.png",
		right: "stone_slab_half.png",
		front: "stone_slab_half.png",
		back: "stone_slab_half.png",
		bottom: "stone_slab_top.png"
	},
	position: [0, -0.25, 0]
}, {
	// Top Stone Slab (44:1)
	id: 204,
	texture: {
		top: "stone_slab_top.png",
		left: "stone_slab_half.png",
		right: "stone_slab_half.png",
		front: "stone_slab_half.png",
		back: "stone_slab_half.png",
		bottom: "stone_slab_top.png"
	},
	position: [0, 0.25, 0]
}, {
	// Bottom Sandstone Slab (44:1)
	id: 205,
	parent: 24,
	position: [0, -0.25, 0]
}, {
	// Top Sandstone Slab (44:1)
	id: 206,
	parent: 24,
	position: [0, 0.25, 0]
}, {
	// Bottom Oak Wood Slab (44:2)
	id: 207,
	parent: 5,
	position: [0, -0.25, 0]
}, {
	// Top Oak Wood Slab (44:2)
	id: 208,
	parent: 5,
	position: [0, 0.25, 0]
}, {
	// Bottom Cobblestone Slab (44:3)
	id: 209,
	parent: 4,
	position: [0, -0.25, 0]
}, {
	// Top Cobblestone Slab (44:3)
	id: 210,
	parent: 4,
	position: [0, 0.25, 0]
}, {
	// Bottom Brick Slab (44:4)
	id: 211,
	parent: 43,
	position: [0, -0.25, 0]
}, {
	// Top Brick Slab (44:4)
	id: 212,
	parent: 45,
	position: [0, 0.25, 0]
}, {
	// Bottom Stone Brick Slab (44:5)
	id: 213,
	parent: 98,
	position: [0, -0.25, 0]
}, {
	// Top Stone Brick Slab (44:5)
	id: 214,
	parent: 98,
	position: [0, 0.25, 0]
}, {
	// Bottom Nether Brick Slab (44:6)
	id: 215,
	parent: 112,
	position: [0, -0.25, 0]
}, {
	// Top Nether Brick Slab (44:6)
	id: 216,
	parent: 112,
	position: [0, 0.25, 0]
}, {
	// Bottom Quartz Brick Slab (44:6)
	id: 217,
	parent: 155,
	position: [0, -0.25, 0]
}, {
	// Top Quartz Brick Slab (44:6)
	id: 218,
	parent: 155,
	position: [0, 0.25, 0]
}, {
	// Bottom Spruce Wood Slab (126:1)
	id: 219,
	parent: 43,
	position: [0, -0.25, 0]
}, {
	// Top Spruce Wood Slab (126:1)
	id: 220,
	parent: 43,
	position: [0, 0.25, 0]
}, {
	// Bottom Birch Wood Slab (126:2)
	id: 221,
	parent: 43,
	position: [0, -0.25, 0]
}, {
	// Top Birch Wood Slab (126:2)
	id: 222,
	parent: 43,
	position: [0, 0.25, 0]
}, {
	// Bottom Jungle Wood Slab (126:3)
	id: 223,
	parent: 43,
	position: [0, -0.25, 0]
}, {
	// Top Jungle Wood Slab (126:3)
	id: 224,
	parent: 43,
	position: [0, 0.25, 0]
}, {
	// Bottom Acacia Wood Slab (126:4)
	id: 225,
	parent: 43,
	position: [0, -0.25, 0]
}, {
	// Top Acacia Wood Slab (126:4)
	id: 226,
	parent: 43,
	position: [0, 0.25, 0]
}, {
	// Bottom Dark Wood Slab (126:5)
	id: 227,
	parent: 43,
	position: [0, -0.25, 0]
}, {
	// Top Dark Wood Slab (126:5)
	id: 228,
	parent: 43,
	position: [0, 0.25, 0]
}];
