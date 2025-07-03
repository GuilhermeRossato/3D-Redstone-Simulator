import {
  reloadCount,
  loadBlockTypeData,
  lookup,
  ids,
  keys,
  blockStore,
} from "./BlockTypeStorage.js";

const saveDelay = 0;

/**
 * Searches for a block type by its ID or name and return its data, optionally updating it with the provided data.
 *
 * @param {number | string | Record<string, any>} id_or_name_or_data
 * @param {boolean} canCreate
 * @param {boolean} canUpdate
 * @param {boolean} strict
 */
export async function blockTypeUpdate(
  id_or_name_or_data,
  canCreate = false,
  canUpdate = false,
  strict = false
) {
  let data =
    typeof id_or_name_or_data === "string" &&
    id_or_name_or_data.length &&
    id_or_name_or_data.length === id_or_name_or_data.replace(/\D/g, "").length
      ? parseInt(id_or_name_or_data)
      : typeof id_or_name_or_data === "string"
      ? id_or_name_or_data.toLowerCase().trim()
      : id_or_name_or_data;
  if (reloadCount === 0) {
    await loadBlockTypeData();
  }
  if (typeof data === "string") {
    if (strict && !lookup["key-data"][data]) {
      throw new Error(`Block type not found for key ${data}`);
    }
    data = lookup["key-id"][data];
  }
  if (typeof data === "number") {
    if (strict && !lookup["id-data"][String(data)]) {
      throw new Error(`Block type not found for id ${data}`);
    }
    return lookup["id-data"][String(data)];
  }
  if (typeof data !== "object") {
    throw new Error("Unexpected argument");
  }
  if (!data.id && data.key && typeof data.key === "string") {
    data.id = lookup["key-id"][data.key];
  } else if (!data.key && data.id && typeof data.id === "number") {
    data.key = lookup["id-key"][data.id];
  }
  const entries = Object.entries(data).filter(
    ([prop]) => !["id", "key"].includes(prop) && !prop.startsWith("_")
  );
  let current = data.id ? lookup["id-data"][data.id] : null;
  if (!current && !canCreate) {
    if (strict) {
      throw new Error("Could not find an existing block type");
    }
    return null;
  }
  if (!canUpdate) {
    return current;
  }
  const updates = current
    ? entries.filter(
        ([prop, value]) =>
          JSON.stringify(current[prop]) !== JSON.stringify(value)
      )
    : entries;
  if (updates.length === 0) {
    return current;
  }
  if (current && updates.length !== entries.length) {
    for (const [prop, value] of updates) {
      current[prop] = value;
    }
    if (data.id) {
      current["id"] = data.id;
    }
    if (data.key) {
      current["key"] = data.key;
    }
  } else {
    if (current) {
      if (!current.id && data.id) {
        current.id = data.id;
      }
      if (!current.key && data.key) {
        current.key = data.key;
      }
    }
    current = data;
  }
  if (!current.id && !canCreate) {
    throw new Error("Block type to update is missing id");
  }
  if (!current.key) {
    throw new Error("Block type must have a key to be created");
  }
  const idList = Object.keys(lookup["id-data"])
    .map((i) => parseInt(String(i)))
    .filter(Boolean)
    .sort();
  if (!current.id) {
    for (let z = (idList[idList.length - 1] || 0) + 1; z < 256; z++) {
      if (!idList.includes(z) && !ids.has(z)) {
        current.id = z;
        break;
      }
    }
  }
  if (!current.id) {
    throw new Error(
      `Could not create an id for new block type: ${JSON.stringify(current)}`
    );
  }
  ids.add(current.id);
  keys.add(current.key);
  lookup["id-data"][current.id] = current;
  lookup["id-key"][current.id] = current.key;
  lookup["key-id"][current.key] = current.id;
  await blockTypeSave("update");
  return current;
}

let tmr;
async function blockTypeSave(source) {
  if (reloadCount === 0) {
    await loadBlockTypeData();
  }
  if (saveDelay && source === "update" && !tmr) {
    tmr = setTimeout(blockTypeSave, saveDelay);
  }
  if (saveDelay && source === "update") {
    return;
  }
  if (saveDelay) {
    tmr = null;
  }
  try {
    const every = Object.fromEntries(
      Object.keys(lookup["id-data"])
        .map((i) => parseInt(String(i)))
        .filter(Boolean)
        .sort()
        .map((i) => [lookup["id-data"][String(i)].key, lookup["id-data"][i]])
    );
    await blockStore.save(`type-data`, every);
  } catch (err) {
    console.log("Failed updating block type data:", err);
    if (!saveDelay || source === "update") {
      throw err;
    }
  }
}
