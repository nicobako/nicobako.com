// Word Steps in the browser: judging the words a player types, drawing the rungs they
// have climbed, and finding the next one when they ask for a hint.
//
// Everything that could be settled at build time already was — the puzzle's two ends and
// its par arrive as data attributes on `#word-steps`, and the start and target rungs are
// markup. What is left here is the part that only exists once someone is playing: the
// chain so far. It is rebuilt with `document.createElement` rather than assembled as
// HTML, and it is the only thing on the page the script creates.

import {
  describeSteps,
  letterDistance,
  shortestLadder,
  wordsOfLength,
} from "./ladders.ts";
import { rememberSolved } from "./progress.ts";

const root = document.querySelector<HTMLElement>("#word-steps");

if (root) {
  const start = root.dataset.start!;
  const target = root.dataset.target!;
  const slug = root.dataset.slug!;
  const par = Number(root.dataset.par);
  const words = wordsOfLength(start.length);

  const chainList = root.querySelector<HTMLOListElement>(".chain")!;
  const targetRung = root.querySelector<HTMLElement>(".rung.target")!;
  const form = root.querySelector<HTMLFormElement>(".entry")!;
  const input = form.querySelector<HTMLInputElement>("input")!;
  const message = root.querySelector<HTMLElement>(".message")!;
  const hintButton = root.querySelector<HTMLButtonElement>("[data-action='hint']")!;
  const undoButton = root.querySelector<HTMLButtonElement>("[data-action='undo']")!;
  const restartButton = root.querySelector<HTMLButtonElement>("[data-action='restart']")!;

  /** The words played so far, the start word first. Never repeats itself. */
  let chain: string[] = [start];
  let hintsUsed = 0;

  const currentWord = () => chain[chain.length - 1]!;
  const solved = () => currentWord() === target;

  /** One rung: the word as separate letters, with the one that changed picked out. */
  function buildRung(word: string, previous: string | undefined): HTMLLIElement {
    const rung = document.createElement("li");
    rung.className = "rung";
    for (let i = 0; i < word.length; i++) {
      const tile = document.createElement("span");
      tile.className = "tile";
      if (previous && previous[i] !== word[i]) tile.classList.add("changed");
      tile.textContent = word[i]!;
      rung.append(tile);
    }
    return rung;
  }

  function render(): void {
    chainList.replaceChildren(
      ...chain.slice(1).map((word, index) => buildRung(word, chain[index])),
    );
    targetRung.classList.toggle("reached", solved());
    form.hidden = solved();
    hintButton.hidden = solved();
    undoButton.disabled = chain.length === 1;
    input.value = "";
  }

  function say(text: string, tone: "info" | "error" | "win" = "info"): void {
    message.textContent = text;
    message.dataset.tone = tone;
  }

  /** Why `word` cannot follow the current one, or null if it can. */
  function reject(word: string): string | null {
    const current = currentWord();
    if (word.length !== start.length) {
      return `Words in this ladder are ${start.length} letters long.`;
    }
    if (word === current) return "That's the word you're already on!";
    if (letterDistance(current, word) > 1) return "Change just one letter at a time.";
    if (chain.includes(word)) return "You already used that word — try a different one.";
    if (!words.has(word)) return `I don't know the word "${word}". Try another one.`;
    return null;
  }

  // Three things can be true at the end, and each gets its own sentence: there is no
  // losing here, so the worst news the game ever gives is that a shorter way exists.
  function finish(): void {
    const steps = chain.length - 1;
    const climbed = `You made it in ${describeSteps(steps)}`;
    if (steps > par) {
      say(`${climbed}. There's a way to do it in ${describeSteps(par)} — try again?`, "win");
    } else if (hintsUsed > 0) {
      say(`${climbed} — the shortest way there is. Now try it without hints!`, "win");
    } else {
      say(`${climbed}, all on your own — and that's the shortest way there is!`, "win");
    }
    rememberSolved(slug);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const word = input.value.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!word) return;

    const problem = reject(word);
    if (problem) {
      say(problem, "error");
      input.select();
      return;
    }

    chain.push(word);
    render();
    if (solved()) finish();
    else say("");
    input.focus();
  });

  hintButton.addEventListener("click", () => {
    // Words already played are off the table, so the hint is always a legal move.
    const route = shortestLadder(currentWord(), target, words, new Set(chain));
    if (!route) {
      say("There's no way on from here. Press Undo and try a different word.", "error");
      return;
    }
    hintsUsed++;
    input.value = route[1]!;
    input.focus();
    input.select();
    say("Try this one.");
  });

  undoButton.addEventListener("click", () => {
    if (chain.length === 1) return;
    chain.pop();
    render();
    say("");
  });

  restartButton.addEventListener("click", () => {
    chain = [start];
    hintsUsed = 0;
    render();
    say("");
  });

  render();
}

