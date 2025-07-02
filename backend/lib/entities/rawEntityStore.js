import {
  appendStorageArray,
  clearStorageArray,
  loadStorageArray,
  writeStorageArray,
} from "../primitives/StorageObjectStore.js";
import { applyEventOnEntityData, createEntityPair } from "./entityUtils.js";

const idSet = new Set();
const movedIdSetMap = new Map();

export async function createNewEntityId(obj) {
  let {id, section} = createEntityPair(obj);
  obj.section = section;

  const list = await loadStorageArray("entities", `meta-${obj.section}`);
  
  list.forEach((entry) => idSet.add(entry.id));

  for (let i = 0; i < 32; i++) {
    if (!idSet.has(id)) {
      const data = await loadStorageArray(
        "entities",
        `data-${obj.section}`,
        id
      );
      if (data.length === 0) {
        return id;
      }
    }
    id = createEntityPair(obj).id;
  }
  throw new Error(
    `Failed to create new entity id on section ${obj.section} (with ${list.length} entries)`
  );
}

export async function loadRawEntityMeta(meta_or_section) {
  const meta =
    typeof meta_or_section === "object"
      ? meta_or_section
      : {
          section:
            meta_or_section.length === 3
              ? meta_or_section
              : meta_or_section
                  .substring(meta_or_section.indexOf("-") - 3)
                  .substring(0, 3),
        };
  const list = await loadStorageArray("entities", `meta-${meta.section}`);
  meta.loaded = Date.now();
  meta.entities = list.length;
  for (const entry of list) {
    meta[entry.id] = entry;
  }
  return meta;
}

export async function saveRawEntityMeta(meta, entries = undefined) {
  meta.entries = await writeStorageArray(
    "entries",
    `meta-${meta.section}`,
    null,
    (entries || Object.values(meta)).filter(
      (v) => typeof v === "object" && v?.id?.length
    )
  );
  return meta;
}

export async function appendRawEntityMeta(meta, ...entries) {
  const list =
    meta.id && entries.length === 0
      ? [meta]
      : entries.length === 1 && entries[0] instanceof Array
      ? entries[0]
      : entries;
  const count = await appendStorageArray(
    "entities",
    `meta-${meta.section}`,
    null,
    list
  );
  if (!meta.id || entries.length !== 0) {
    meta.entries = count;
  }
  return count;
}

export async function loadRawEntityData(id_or_obj) {
  const obj =
    id_or_obj &&
    typeof id_or_obj === "object" &&
    typeof id_or_obj.state === "object"
      ? id_or_obj.state
      : id_or_obj &&
        typeof id_or_obj === "object" &&
        typeof id_or_obj.id === "string"
      ? id_or_obj
      : {
          id: id_or_obj,
        };
  if (!obj.section) {
    obj.section = obj.id.substring(obj.id.indexOf("-") - 3).substring(0, 3);
  }
  const list = await loadStorageArray(
    "entities",
    `data-${obj.section}`,
    obj.id
  );
  if (!list.length) return null;
  obj.loaded = Date.now();
  obj.events = list.length - 1;
  for (const key in list[0]) {
    if (["id", "loaded", "events"].includes(key)) {
      continue;
    }
    obj[key] = list[0][key];
  }
  for (const event of list.slice(1)) {
    applyEventOnEntityData(obj, event);
  }
  // Add to moved because it was loaded
  let movedIdSet = movedIdSetMap.get(obj.section);
  if (!movedIdSet) {
    movedIdSet = new Set(obj.id);
    movedIdSetMap.set(obj.section, movedIdSet);
  } else if (!movedIdSet.has(obj.id)) {
    movedIdSet.add(obj.id);
  }
  return {
    state: obj,
    stored: list[0],
    events: list.slice(1),
  };
}

export async function saveRawEntityData(obj, events = []) {
  const section = obj.id.substring(obj.id.indexOf("-") - 3).substring(0, 3);
  const filtered = events.filter(
    (v, i, a) =>
      (i === 0 ||
        typeof v.value === "object" ||
        !v.key ||
        a[i - 1].key !== v.key ||
        a[i - 1].value !== v.value) &&
      !isNaN(v.time || (v.time = Date.now()))
  );
  const count = await writeStorageArray("entities", `data-${section}`, obj.id, [
    {
      ...obj,
      stored: undefined,
      loaded: undefined,
      saved: Date.now(),
      events: filtered.length,
    },
    ...filtered,
  ]);
  if (count !== filtered.length + 1) {
    throw new Error(
      `Failed to save entity data on section ${section} (with ${count} entries)`
    );
  }
}

export async function appendRawEntityData(id_or_obj, ...events) {
  const obj =
    typeof id_or_obj === "object"
      ? id_or_obj
      : {
          id: id_or_obj,
        };
  if (!obj.section) {
    obj.section = obj.id.substring(obj.id.indexOf("-") - 3).substring(0, 3);
  }
  const list = events.length === 1 && events[0] instanceof Array ? events[0] : events;
  
  // Add to moved if at least one append is a position update
  let movedIdSet = movedIdSetMap.get(obj.section);
  if ((!movedIdSet || !movedIdSet.has(obj.id)) && list.find(e => e.key === 'pose')) {
    movedIdSet = new Set(obj.id);
    movedIdSetMap.set(obj.section, movedIdSet);
  }
  if (!movedIdSet) {
    movedIdSet = new Set(obj.id);
    movedIdSetMap.set(obj.section, movedIdSet);
  } else if (!movedIdSet.has(obj.id)) {
    movedIdSet.add(obj.id);
  }
  if (!movedIdSet.has(obj.id)) {
    movedIdSet.add(obj.id);
  }
  return await appendStorageArray(
    "entities",
    `data-${obj.section}`,
    obj.id,
    list
  );
}

export async function removeRawEntityData(id_or_obj) {
  const obj =
    typeof id_or_obj === "object"
      ? id_or_obj
      : {
          id: id_or_obj,
        };
  if (!obj.section) {
    obj.section = obj.id.substring(obj.id.indexOf("-") - 3).substring(0, 3);
  }
  return await clearStorageArray("entities", `data-${obj.section}`, obj.id);
}
