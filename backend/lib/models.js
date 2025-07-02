import { createStorageClient } from "./primitives/createStorageClient.js";

const loadUsers = createStorageClient.bind(null, "users");
const loadRooms = createStorageClient.bind(null, "rooms");
const loadItems = createStorageClient.bind(null, "items");
const loadWorld = createStorageClient.bind(null, "world");

export const loaders = {
  users: loadUsers,
  rooms: loadRooms,
  items: loadItems,
  world: loadWorld,
};

export const loaded = {
  users: new Set(),
  rooms: new Set(),
  items: new Set(),
  world: new Set(),
};

export const record = {
  users: loadUsers({ n: 16 }),
  rooms: loadRooms({ n: 16 }),
  items: loadItems({ n: 16 }),
  world: loadWorld({ n: 16 }),
};

export const entities = await createStorageClient(
  "entities",
  () => ({
    type: "",
    position: [0, 0, 0],
    direction: [0, 0, 0],
    health: 0,
    maxHealth: 0,
    path: [0, 0, 0],
    player: "",
    target: "",
  }),
  {
    maxPerFile: 1_000,
    writeDelay: 20_000,
    manualSave: false,
  }
);

export const players = await createStorageClient(
  "player",
  () => ({
    id: "",
    cookieId: "",
    lastLogin: 0,
    name: "",
    entity: "",
    position: [0, 0, 0],
    direction: [0, 0, 0],
  }),
  {
    maxPerFile: 1000,
    writeDelay: 5_000,
    manualSave: false,
  }
);

export const actions = await createStorageClient(
  "actions",
  () => ({
    actor: "",
    position: [0, 0, 0],
    direction: [0, 0, 0],
    type: "",
    time: 0,
    target: "",
  }),
  {
    maxPerFile: 1000,
    manualSave: true,
  }
);
