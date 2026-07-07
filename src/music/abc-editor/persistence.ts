const PARAM = "tune";
const STORAGE_KEY = "abc-editor:tunes";

export interface Tune {
  id: string;
  name: string;
  abc: string;
}

export interface TuneStore {
  activeId: string;
  tunes: Tune[];
}

function generateId(): string {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function newTune(name: string, abc: string): Tune {
  return { id: generateId(), name, abc };
}

export function getActive(store: TuneStore): Tune {
  return store.tunes.find((t) => t.id === store.activeId) ?? store.tunes[0];
}

function readStore(): TuneStore | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as TuneStore;
    if (
      parsed &&
      Array.isArray(parsed.tunes) &&
      parsed.tunes.length > 0 &&
      typeof parsed.activeId === "string"
    ) {
      return parsed;
    }
  } catch {
    // Corrupt JSON — fall through to a fresh store.
  }
  return null;
}

export function saveStore(store: TuneStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage may be unavailable (private browsing, quota) — the URL still carries the tune.
  }

  const url = new URL(location.href);
  url.searchParams.set(PARAM, getActive(store).abc);
  history.replaceState(null, "", url);
}

export function loadStore(seedAbc: string): TuneStore {
  let store = readStore();

  if (!store) {
    const seed = newTune("Default", seedAbc);
    store = { activeId: seed.id, tunes: [seed] };
    saveStore(store);
  }

  const fromUrl = new URLSearchParams(location.search).get(PARAM);
  if (fromUrl && getActive(store).abc !== fromUrl) {
    const imported = newTune("Imported tune", fromUrl);
    store.tunes.push(imported);
    store.activeId = imported.id;
    saveStore(store);
  }

  return store;
}

export function createTune(store: TuneStore, name: string, abc: string): TuneStore {
  const tune = newTune(name, abc);
  store.tunes.push(tune);
  store.activeId = tune.id;
  return store;
}

export function duplicateTune(store: TuneStore): TuneStore {
  const active = getActive(store);
  const copy = newTune(`Copy of ${active.name}`, active.abc);
  store.tunes.push(copy);
  store.activeId = copy.id;
  return store;
}

export function renameTune(store: TuneStore, name: string): TuneStore {
  getActive(store).name = name;
  return store;
}

export function setActive(store: TuneStore, id: string): TuneStore {
  if (store.tunes.some((t) => t.id === id)) store.activeId = id;
  return store;
}

export function deleteTune(store: TuneStore, seedAbc: string): TuneStore {
  store.tunes = store.tunes.filter((t) => t.id !== store.activeId);
  if (store.tunes.length === 0) {
    const seed = newTune("Default", seedAbc);
    store.tunes.push(seed);
    store.activeId = seed.id;
  } else {
    store.activeId = store.tunes[0].id;
  }
  return store;
}
