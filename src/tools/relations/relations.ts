// The relation grid: a list of items, and which pairs of them are related.
//
// A relation has no direction — A related to B is B related to A — so it is stored once,
// as an unordered pair, and the grid's symmetry falls out of that rather than being
// kept in step by hand. The store lives in `localStorage`; reading and writing are both
// wrapped, because private browsing throws on it and the grid should still work for
// the length of a visit.

const STORAGE_KEY = "relations:grid";

export interface Item {
  id: string;
  name: string;
}

export interface Grid {
  items: Item[];
  /** Related pairs, each as `pairKey(a, b)`. */
  links: Set<string>;
}

interface StoredGrid {
  items: Item[];
  links: string[];
}

function generateId(): string {
  return `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** The key for an unordered pair: the same whichever way round the ids are given. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}~${b}` : `${b}~${a}`;
}

export function isRelated(grid: Grid, a: string, b: string): boolean {
  return grid.links.has(pairKey(a, b));
}

export function setRelated(grid: Grid, a: string, b: string, related: boolean): void {
  if (a === b) return;
  const key = pairKey(a, b);
  if (related) grid.links.add(key);
  else grid.links.delete(key);
}

/** The items related to `id`, in grid order. */
export function relatedTo(grid: Grid, id: string): Item[] {
  return grid.items.filter((item) => item.id !== id && isRelated(grid, id, item.id));
}

export function findByName(grid: Grid, name: string): Item | undefined {
  const wanted = name.trim().toLocaleLowerCase();
  return grid.items.find((item) => item.name.toLocaleLowerCase() === wanted);
}

/** Adds an item, or returns null when the name is empty or already taken. */
export function addItem(grid: Grid, name: string): Item | null {
  const trimmed = name.trim();
  if (!trimmed || findByName(grid, trimmed)) return null;
  const item = { id: generateId(), name: trimmed };
  grid.items.push(item);
  return item;
}

/** Renames an item; false when the new name is empty or belongs to another item. */
export function renameItem(grid: Grid, id: string, name: string): boolean {
  const trimmed = name.trim();
  const item = grid.items.find((i) => i.id === id);
  const clash = findByName(grid, trimmed);
  if (!item || !trimmed || (clash && clash.id !== id)) return false;
  item.name = trimmed;
  return true;
}

/** Removes an item along with every relation it was part of. */
export function removeItem(grid: Grid, id: string): void {
  grid.items = grid.items.filter((item) => item.id !== id);
  for (const key of grid.links) {
    if (key.split("~").includes(id)) grid.links.delete(key);
  }
}

export function loadGrid(): Grid {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredGrid;
      if (Array.isArray(parsed.items) && Array.isArray(parsed.links)) {
        return { items: parsed.items, links: new Set(parsed.links) };
      }
    }
  } catch {
    // Unavailable storage or corrupt JSON — start empty.
  }
  return { items: [], links: new Set() };
}

export function saveGrid(grid: Grid): void {
  const stored: StoredGrid = { items: grid.items, links: [...grid.links] };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Nothing to do: the grid just won't outlive this visit.
  }
}
