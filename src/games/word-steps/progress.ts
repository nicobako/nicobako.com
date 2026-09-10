// Which ladders have been finished on this device.
//
// Its own module rather than part of `game.ts` because the index page needs to read it
// without pulling the word lists and the search along with it. Reading and writing are
// both wrapped: a browser in private mode throws on `localStorage`, and a child who
// cannot see their ticks should still be able to play.

const SOLVED_KEY = "word-steps:solved";

/** The slugs of the ladders finished on this device. */
export function solvedLadders(): Set<string> {
  try {
    const stored = localStorage.getItem(SOLVED_KEY);
    return new Set(stored ? (JSON.parse(stored) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Records a finished ladder. Quietly does nothing where storage is unavailable. */
export function rememberSolved(slug: string): void {
  try {
    const solved = solvedLadders();
    solved.add(slug);
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...solved]));
  } catch {
    // Nothing to do: finishing a ladder just doesn't stick on this device.
  }
}
