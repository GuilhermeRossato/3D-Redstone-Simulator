const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Cache for loaded block data
let blockDataCache = {};

// Function to load block data from JSON files
function loadBlockData(blockKey) {
  const fileName = blockKey.toLowerCase() + '.json';
  const filePath = path.join(__dirname, '../data/blocks', fileName);
  
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading block data for ${blockKey}:`, error);
  }
  
  return null;
}

// Function to get all available blocks
function getAllBlocks() {
  const blocksDir = path.join(__dirname, '../data/blocks');
  const blocks = {};
  
  try {
    const files = fs.readdirSync(blocksDir);
    files.forEach((file, index) => {
      if (file.endsWith('.json')) {
        const blockKey = file.replace('.json', '').toUpperCase();
        const blockData = loadBlockData(blockKey);
        if (blockData) {
          blocks[(index + 1).toString()] = {
            data: {
              ...blockData,
              loaded: Date.now()
            },
            key: blockKey,
            id: index + 1
          };
        }
      }
    });
  } catch (error) {
    console.error('Error loading blocks directory:', error);
  }
  
  return blocks;
}

// GET /api/blocks - Get all blocks
router.get('/', (req, res) => {
  try {
    const blocks = getAllBlocks();
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load blocks' });
  }
});

// GET /api/blocks/:id - Get specific block by ID
router.get('/:id', (req, res) => {
  try {
    const blockId = req.params.id;
    const blocks = getAllBlocks();
    const block = blocks[blockId];
    
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    res.json(block);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load block' });
  }
});

// GET /api/blocks/:id/texture - Get texture for specific block
router.get('/:id/texture', (req, res) => {
  try {
    const blockId = req.params.id;
    const blocks = getAllBlocks();
    const block = blocks[blockId];
    
    if (!block || !block.data.texture) {
      return res.status(404).json({ error: 'Block texture not found' });
    }
    
    res.json({ texture: block.data.texture });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load block texture' });
  }
});

module.exports = router;