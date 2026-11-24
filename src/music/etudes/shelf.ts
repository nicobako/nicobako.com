// The shelf: etudes you have kept, by name.
//
// An etude is already a URL — every field is in the query string, which is what makes one
// shareable and bookmarkable. What that does not give you is a *list*: the etude you
// built yesterday exists only if you remembered to bookmark it, and a tool you open
// before practising needs a shelf more than it needs another slider.
//
// So the shelf stores names and query strings, nothing else. It is per browser on
// purpose: the etude itself travels in the link, so what is local is only which ones this
// person kept. Every call is wrapped against a browser that throws on `localStorage` —
// private windows and blocked site data do — and a shelf that cannot be read is simply
// empty rather than an error.

/** One kept etude: the name it was saved under, and the query string that rebuilds it. */
export interface SavedEtude {
  name: string;
  /** The builder's query string, leading `?` included. */
  search: string;
}

const KEY = "nicobako.etudes";

/** A shelf is short by nature; a cap keeps a runaway loop from filling storage. */
const MAX_SAVED = 60;

function isSaved(value: unknown): value is SavedEtude {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SavedEtude>;
  return typeof candidate.name === "string" && typeof candidate.search === "string";
}

/** Most recently saved first, which is the order a shelf is read in. */
export function listSaved(): SavedEtude[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSaved).slice(0, MAX_SAVED) : [];
  } catch {
    return [];
  }
}

function write(list: SavedEtude[]): SavedEtude[] {
  const capped = list.slice(0, MAX_SAVED);
  try {
    localStorage.setItem(KEY, JSON.stringify(capped));
  } catch {
    // A full or blocked store loses the save; the etude is still in the address bar.
  }
  return capped;
}

/**
 * Keep this etude under this name, replacing any etude already kept under it.
 *
 * Saving by name rather than by a generated id is deliberate: the name is the title
 * field, so saving twice while working on one etude updates it instead of leaving a
 * shelf full of near-identical copies.
 */
export function saveEtude(name: string, search: string): SavedEtude[] {
  const trimmed = name.trim();
  if (trimmed === "") return listSaved();
  const rest = listSaved().filter((saved) => saved.name !== trimmed);
  return write([{ name: trimmed, search }, ...rest]);
}

export function removeSaved(name: string): SavedEtude[] {
  return write(listSaved().filter((saved) => saved.name !== name));
}
