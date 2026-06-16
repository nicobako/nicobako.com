// ---------------------------------------------------------------------------
// Board geometry and game content for "Classrooms & Angry Teachers".
// All coordinates here are in TILE units (grid cells), not pixels.
// ---------------------------------------------------------------------------

export const COLS = 15;
export const ROWS = 13;
export const TILE = 40;

// Tile kinds. Walls block movement; everything else is walkable.
export const Tile = {
  Wall: 0,
  Floor: 1, // corridor / hallway
  Room: 2, // classroom interior
  Door: 3, // walkable opening in a classroom wall
} as const;
export type TileType = (typeof Tile)[keyof typeof Tile];

export interface Cell {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// The four classroom interiors (top-left, top-right, bottom-left, bottom-right).
export const ROOMS: Rect[] = [
  { x: 1, y: 1, w: 4, h: 3 },
  { x: 10, y: 1, w: 4, h: 3 },
  { x: 1, y: 9, w: 4, h: 3 },
  { x: 10, y: 9, w: 4, h: 3 },
];

// One doorway carved through each classroom's wall, connecting it to a corridor.
export const DOORS: Cell[] = [
  { x: 2, y: 4 },
  { x: 11, y: 4 },
  { x: 2, y: 8 },
  { x: 11, y: 8 },
];

// Builds the tile grid procedurally so the board is always well-formed:
// start solid, carve corridors, carve classrooms, then punch the doors.
export function buildGrid(): TileType[][] {
  const grid: TileType[][] = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) grid[y][x] = Tile.Wall;
  }

  // Horizontal hallway band (rows 5-7) and vertical hallway band (cols 6-8).
  for (let y = 5; y <= 7; y++) {
    for (let x = 1; x <= 13; x++) grid[y][x] = Tile.Floor;
  }
  for (let y = 1; y <= 11; y++) {
    for (let x = 6; x <= 8; x++) grid[y][x] = Tile.Floor;
  }

  // Carve the classroom interiors.
  for (const r of ROOMS) {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) grid[y][x] = Tile.Room;
    }
  }

  // Punch the doors.
  for (const d of DOORS) grid[d.y][d.x] = Tile.Door;

  return grid;
}

// ---------------------------------------------------------------------------
// Weapons & tools. Each gives attack power (used in combat) or heals health.
// ---------------------------------------------------------------------------
export interface ItemType {
  key: string;
  label: string; // single character drawn on the tile
  name: string;
  power: number; // attack bonus
  heal: number; // health restored on pickup
  color: [number, number, number];
}

export const ITEM_TYPES: Record<string, ItemType> = {
  ruler: { key: "ruler", label: "R", name: "Ruler", power: 1, heal: 0, color: [120, 200, 120] },
  eraser: { key: "eraser", label: "E", name: "Eraser", power: 1, heal: 0, color: [230, 150, 200] },
  slingshot: { key: "slingshot", label: "Y", name: "Slingshot", power: 2, heal: 0, color: [210, 165, 90] },
  textbook: { key: "textbook", label: "B", name: "Textbook", power: 2, heal: 0, color: [120, 160, 230] },
  airplane: { key: "airplane", label: "P", name: "Paper Plane", power: 3, heal: 0, color: [235, 238, 250] },
  apple: { key: "apple", label: "A", name: "Apple", power: 0, heal: 2, color: [230, 90, 90] },
};

export interface ItemSpawn extends Cell {
  key: string;
}
export const ITEM_SPAWNS: ItemSpawn[] = [
  { x: 1, y: 1, key: "ruler" }, // classroom A
  { x: 13, y: 1, key: "slingshot" }, // classroom B
  { x: 1, y: 11, key: "textbook" }, // classroom C
  { x: 13, y: 11, key: "airplane" }, // classroom D
  { x: 7, y: 3, key: "eraser" }, // hallway
  { x: 7, y: 9, key: "apple" }, // hallway
];

// ---------------------------------------------------------------------------
// Angry teachers — one per classroom, getting tougher as you go.
// ---------------------------------------------------------------------------
export interface TeacherSpawn extends Cell {
  strength: number;
  name: string;
}
export const TEACHER_SPAWNS: TeacherSpawn[] = [
  { x: 3, y: 2, strength: 2, name: "Mr. Grumble" },
  { x: 12, y: 2, strength: 3, name: "Ms. Snapp" },
  { x: 3, y: 10, strength: 4, name: "Dr. Stern" },
  { x: 12, y: 10, strength: 5, name: "Principal Doom" },
];

// ---------------------------------------------------------------------------
// Hall monitors — roaming hazards that only appear on the final level. They
// chase the player and attack on contact, but they can never be defeated.
// ---------------------------------------------------------------------------
export interface MonitorSpawn extends Cell {
  name: string;
}
export const MONITOR_SPAWNS: MonitorSpawn[] = [
  { x: 1, y: 6, name: "Hall Monitor" },
  { x: 13, y: 6, name: "Hall Monitor" },
];

export const PLAYER_START: Cell = { x: 7, y: 6 };
export const MAX_HEALTH = 5;

// Lives carry across levels; health refills each level (and after losing a life).
export const START_LIVES = 3;

// The game runs across three levels of increasing danger.
export const TOTAL_LEVELS = 3;
