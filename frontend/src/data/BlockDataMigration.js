// Migration script for updating BlockData usage
// This file helps migrate any remaining code from old array-style to new object-style

import BlockData, { 
  getBlockData, 
  getBlockTexture, 
  getBlockName, 
  isBlockSolid,
  BlockDataLegacyProxy 
} from './LegacyBlockData.js';

// Migration function that automatically updates code patterns
export function migrateCodeToNewFormat(code) {
  // Replace common patterns
  let migratedCode = code;
  
  // BlockData[id].texture -> getBlockTexture(id)
  migratedCode = migratedCode.replace(
    /BlockData\[([^\]]+)\]\.texture/g, 
    'getBlockTexture($1)'
  );
  
  // BlockData[id].name -> getBlockName(id)
  migratedCode = migratedCode.replace(
    /BlockData\[([^\]]+)\]\.name/g, 
    'getBlockName($1)'
  );
  
  // BlockData[id].isSolid -> isBlockSolid(id)
  migratedCode = migratedCode.replace(
    /BlockData\[([^\]]+)\]\.isSolid/g, 
    'isBlockSolid($1)'
  );
  
  // BlockData[id] -> getBlockData(id)
  migratedCode = migratedCode.replace(
    /BlockData\[([^\]]+)\](?!\.|\.)/g, 
    'getBlockData($1)'
  );
  
  return migratedCode;
}

// Console helper for manual migration
export function logMigrationHelp() {
  console.log(`
=== BlockData Migration Guide ===

Old Usage -> New Usage:
BlockData[id] -> getBlockData(id)
BlockData[id].texture -> getBlockTexture(id)
BlockData[id].name -> getBlockName(id)
BlockData[id].isSolid -> isBlockSolid(id)

Available Functions:
- getBlockData(blockId): Get full block data object
- getBlockTexture(blockId): Get block texture(s)
- getBlockName(blockId): Get block display name
- isBlockSolid(blockId): Check if block is solid

Legacy Compatibility:
- Use BlockDataLegacyProxy for immediate compatibility
- Legacy adapter automatically converts format

Network Integration:
- Block data now loads from backend /api/blocks
- Automatic fallback to hardcoded data
- Real-time updates supported
  `);
}

// Export for development/debugging
window.BlockDataMigration = {
  migrateCodeToNewFormat,
  logMigrationHelp,
  getBlockData,
  getBlockTexture,
  getBlockName,
  isBlockSolid
};

export default {
  migrateCodeToNewFormat,
  logMigrationHelp,
  getBlockData,
  getBlockTexture,
  getBlockName,
  isBlockSolid,
  BlockDataLegacyProxy
};