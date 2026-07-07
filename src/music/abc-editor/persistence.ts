const PARAM = "tune";
const STORAGE_KEY = "abc-editor:tune";

export function loadSavedAbc(): string | null {
  const fromUrl = new URLSearchParams(location.search).get(PARAM);
  if (fromUrl) return fromUrl;

  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveAbc(abc: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, abc);
  } catch {
    // Storage may be unavailable (private browsing, quota) — the URL still carries the tune.
  }

  const url = new URL(location.href);
  url.searchParams.set(PARAM, abc);
  history.replaceState(null, "", url);
}
