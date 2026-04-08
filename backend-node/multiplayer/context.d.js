
/**
 * Multiplayer packet handler context object
 * Contains all state and data needed for processing multiplayer packets
 * 
 * @typedef {Object} PacketHandlerContext
 * 
 * // Core player and entity data
 * @property {Player} [player] - Current player data object
 * @property {Entity} [entity] - Current entity data object
 * @property {ServerRegion} [region] - Current region instance
 * @property {ServerChunk} [chunk] - Current chunk instance
 * 
 * // Authentication and session data
 * @property {string} [playerId] - Player's primary login code
 * @property {string} [cookieId] - Browser cookie identifier for persistence
 * @property {string} [pid] - Player ID shorthand reference
 * 
 * // Timing and synchronization
 * @property {number} [offset] - Client-server time offset in milliseconds
 * @property {number} [setupTime] - Timestamp when context was set up
 * @property {Array<[number, number]>} [syncPairs] - Array of [client, server] time pairs for sync
 * 
 * // Client state tracking
 * @property {boolean} [unfocused] - Whether client window is unfocused/hidden
 * @property {boolean} [idle] - Whether client is idle/inactive
 * @property {boolean} [loggedIn] - Whether player is currently logged in
 * 
 * // Communication
 * @property {Function} [send] - Function to send data back to client
 * 
 * // Spatial tracking
 * @property {Object} [entry] - Region entry data when player enters region
 * @property {number[]} [pose] - Alternative pose reference [x, y, z, rx, ry, rz]
 * 
 * // Session management
 * @property {boolean} [forceLogoff] - Flag to force logout of existing session
 * @property {WebSocket} [ws] - WebSocket connection reference
 * @property {string} [ip] - Client IP address
 * @property {string} [userAgent] - Client user agent string
 * 
 * // Event handling
 * @property {Array<Object>} [pendingEvents] - Queue of events to process
 * @property {Map<string, any>} [cache] - Context-specific cache storage
 * 
 * // Error handling and debugging
 * @property {Array<Error>} [errors] - Collection of errors during processing
 * @property {Object} [debug] - Debug information and flags
 * @property {boolean} [verbose] - Enable verbose logging for this context
 */

/**
 * Player data structure
 * @typedef {Object} Player
 * @property {string} id - Player unique identifier
 * @property {string} name - Player display name
 * @property {string} cookieId - Browser cookie identifier
 * @property {number[]} pose - Player position and rotation [x, y, z, rx, ry, rz]
 * @property {string} entity - Associated entity ID
 * @property {string} region - Current region ID
 * @property {number} health - Current health points
 * @property {number} maxHealth - Maximum health points
 * @property {number} lastLogin - Last login timestamp
 * @property {number} spawned - Spawn timestamp
 * @property {number} despawned - Despawn timestamp
 */

/**
 * Entity data structure
 * @typedef {Object} Entity
 * @property {string} id - Entity unique identifier
 * @property {string} player - Associated player ID
 * @property {string} name - Entity display name
 * @property {number[]} pose - Entity position and rotation [x, y, z, rx, ry, rz]
 * @property {number} health - Current health points
 * @property {number} maxHealth - Maximum health points
 * @property {number} spawned - Spawn timestamp
 */

/**
 * Server region instance
 * @typedef {Object} ServerRegion
 * @property {string} id - Region identifier
 * @property {number} rx - Region X coordinate
 * @property {number} ry - Region Y coordinate  
 * @property {number} rz - Region Z coordinate
 * @property {boolean} loaded - Whether region is loaded
 * @property {Object} state - Region state data
 * @property {Object} state.entities - Entities in region
 * @property {Object} state.players - Players in region
 * @property {Function} add - Add event to region
 * @property {Function} load - Load region data
 * @property {Function} save - Save region data
 * @property {Function} getPlayerIds - Get all player IDs in region
 */

/**
 * Server chunk instance
 * @typedef {Object} ServerChunk
 * @property {string} id - Chunk identifier
 * @property {number} cx - Chunk X coordinate
 * @property {number} cy - Chunk Y coordinate
 * @property {number} cz - Chunk Z coordinate
 * @property {boolean} loaded - Whether chunk is loaded
 * @property {Object} state - Chunk state data
 * @property {Array} state.blocks - Blocks in chunk
 * @property {Array} state.inside - Players/entities inside chunk
 * @property {Function} add - Add event to chunk
 * @property {Function} load - Load chunk data
 * @property {Function} save - Save chunk data
 * @property {Function} getTimeSinceLoad - Get time since last load
 */