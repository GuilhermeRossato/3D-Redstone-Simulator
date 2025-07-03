import { normalizePose } from "../utils/normalizePose.js";
import {
  appendRawEntityData,
  appendRawEntityMeta,
  createNewEntityId,
  loadRawEntityData,
  removeRawEntityData,
  saveRawEntityData,
} from "./entities/rawEntityStore.js";

const sample = {
  id: "",
  section: "",
  created: 0,
  type: "",
  pose: [],
  events: 0,
}

export async function loadServerEntity(id) {
  const data = await loadRawEntityData(id);
  return data;
}

/**
 * Create a new server entity and save it to the storage.
 * @template {Record<string, unknown>&Partial<typeof sample>} T
 * @param {T} obj
 * @returns {Promise<T & typeof sample>}
 */
export async function createServerEntity(obj) {
  obj.pose = normalizePose(obj);
  obj.created = Date.now();
  obj.id = await createNewEntityId(obj);
  obj.events = 0;
  const meta = {
    id: obj.id,
    section: obj.section,
    created: obj.created,
    type: obj.type || "",
    pose: obj.pose || [],
  };
  await appendRawEntityMeta(meta);
  await saveRawEntityData(obj);
  return wrapEntityObject(obj);
}

function wrapEntityObject(obj) {
  if (!obj.update) {
    obj.update = (...args) => {
      const now = Date.now();
      if (args.length === 1 && args[0] instanceof Array) {
        args = args[0];
      }
      if (args.length === 2 && typeof args[0] === "string" && args[1] !== undefined) {
        args = [{ key: args[0], value: args[1] }];
      }
      for (let i = 0; i < args.length; i++) {
        if (!args[i].time) {
          args[i].time = now;
        }
        obj.events++;
      }
      return appendRawEntityData(obj, args);
    };
  }
  if (!obj.remove) {
    obj.remove = removeEntity.bind(null, obj);
  }
  return obj;
}

export async function loadEntity(id_or_obj) {
  return await loadRawEntityData(id_or_obj);
}

export async function removeEntity(id_or_obj) {
  updateNearbyEntities([], typeof id_or_obj === "object" ? [id_or_obj] : [{id: id_or_obj}]);
  return await removeRawEntityData(id_or_obj);
}

/**
 * The last chunk string by entity id
 * @type {Map<string, string>}
 */
const nearbyIdCache = new Map();

/**
 * The list of entities by chunk string
 * @type {Map<string, any[]>}
 */
const nearbyEntityCache = new Map();

export function updateNearbyEntities(entities = [], removed = []) {
  let updates = 0;
  // Remove entities from the maps
  for (const entity of removed) {
    const chunk = nearbyIdCache.get(entity.id);
    if (chunk) {
      updates++;
      nearbyIdCache.delete(entity.id);
      const list = nearbyEntityCache.get(chunk);
      if (list) {
        const updated = list.filter((e) => e.id !== entity.id);
        if (updated.length === 0) {
          updates++;
          nearbyEntityCache.delete(chunk);
        } else if (updated.length !== list.length) {
          updates++;
          nearbyEntityCache.set(chunk, updated);
        }
      }
    }
  }
  // Add entities to the maps
  for (const entity of entities) {
    const chunk = nearbyIdCache.get(entity.id);
    entity.chunk = entity.pose
      .slice(0, 3)
      .map((v) => Math.floor(v / 16))
      .join(",");
    // Double check list at chunk has this entity
    if (entity.chunk === chunk) {
      // Verify if the previous chunk must be added.
      const list = nearbyEntityCache.get(entity.chunk);
      if (!list?.length) {
        updates++;
        nearbyEntityCache.set(entity.chunk, [entity]);
      } else if (
        list[entity.chunkIndex]?.id !== entity.id &&
        !list.find((e) => e.id === entity.id)
      ) {
        updates++;
        list.push(entity);
        nearbyEntityCache.set(entity.chunk, [entity]);
      }
    } else {
      // Verify if the previous chunk must be removed.
      if (chunk) {
        const list = nearbyEntityCache.get(chunk);
        if (list) {
          const updated = list.filter((e) => e.id !== entity.id);
          if (updated.length === 0) {
            updates++;
            nearbyEntityCache.delete(chunk);
          } else if (updated.length !== list.length) {
            updates++;
            nearbyEntityCache.set(chunk, updated);
          }
        }
      }
      // Update the cached chunk for this entity
      updates++;
      nearbyIdCache.set(entity.id, entity.chunk);
      // Add the entity to the new chunk list if it not already exists
      const list = nearbyEntityCache.get(entity.chunk) || [];
      const i =
        list[entity.chunkIndex]?.id === entity.id
          ? entity.chunkIndex
          : list.findIndex((e) => e.id === entity.id);
      if (i === -1) {
        updates++;
        entity.chunkIndex = list.length;
        list.push(entity);
        nearbyEntityCache.set(entity.chunk, list);
      } else {
        entity.chunkIndex = i;
      }
    }
  }
  return updates;
}

export async function getEntitiesNearby(pos, offset) {
  const entities = [];
  const ids = new Set();
  const chunks = new Set();
  const [xr, yr, zr] = pos
    .slice(0, 3)
    .map((p) =>
      [Math.min(p + offset, p - offset), Math.max(p + offset, p - offset)].map(
        (v) => Math.floor(v / 16)
      )
    );
  for (let x = xr[0]; x <= xr[1]; x++) {
    for (let y = yr[0]; y <= yr[1]; y++) {
      for (let z = zr[0]; z <= zr[1]; z++) {
        const chunk = [x, y, z].join(",");
        if (chunks.has(chunk)) {
          continue;
        }
        chunks.add(chunk);
        const list = nearbyEntityCache.get(chunk);
        if (!list?.length) {
          continue;
        }
        for (const entity of list) {
          if (!ids.has(entity.id)) {
            ids.add(entity.id);
            entities.push(entity);
          }
        }
      }
    }
  }
  return {entities, chunks: Array.from(chunks) };
}
