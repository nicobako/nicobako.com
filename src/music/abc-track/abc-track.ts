import abcjs from "abcjs";
import type { SynthObjectController } from "abcjs";
import "abcjs/abcjs-audio.css";

/**
 * Mounting logic for `components/AbcTrack.astro`.
 *
 * The tune itself is authored at build time and travels to the browser as data
 * attributes on the track's root element; the only reason there is a script here
 * at all is that abcjs draws its SVG and builds its audio widget in the DOM.
 * Nothing on this side decides *what* a track contains — it just hands the
 * source abcjs was always going to be handed.
 */

/** Marks the root elements this module has already drawn into. */
const mounted = new WeakSet<HTMLElement>();

/** abcjs emits warnings as HTML fragments; the track shows them as plain text. */
function warningText(warnings: string[] | undefined): string {
  if (!warnings?.length) return "";
  return warnings.map((warning) => warning.replace(/<\/?[^>]+>/g, "")).join("\n");
}

/**
 * Draw one track: SVG notation into `[data-notation]`, abcjs's playback widget
 * into `[data-audio]`, and any parse warnings into `[data-warnings]`.
 *
 * `transposition` is in semitones. `visualTranspose` shifts the notation and
 * abcjs then subtracts the same amount back out of the MIDI (it reads the value
 * as a transposing-instrument offset, so the sound stays at concert pitch), so
 * playback only follows the notation if a matching `midiTranspose` goes to the
 * synth as well.
 */
export function mountAbcTrack(root: HTMLElement): void {
  if (mounted.has(root)) return;
  mounted.add(root);

  const notation = root.querySelector<HTMLElement>("[data-notation]")!;
  const warnings = root.querySelector<HTMLElement>("[data-warnings]")!;
  const audio = root.querySelector<HTMLElement>("[data-audio]")!;

  const abc = root.dataset.abc ?? "";
  const transposition = Number(root.dataset.transposition ?? 0) || 0;

  const tune = abcjs.renderAbc(notation, abc, {
    responsive: "resize",
    visualTranspose: transposition,
  })[0];

  warnings.textContent = warningText(tune?.warnings);

  if (!tune) return;

  if (!abcjs.synth.supportsAudio()) {
    audio.textContent = "Audio playback isn't supported in this browser.";
    return;
  }

  const synthControl: SynthObjectController = new abcjs.synth.SynthController();
  synthControl.load(audio, null, {
    displayLoop: true,
    displayRestart: true,
    displayPlay: true,
    displayProgress: true,
    displayWarp: true,
  });
  void synthControl.setTune(tune, false, { midiTranspose: transposition });
}

/** Mount every track in `scope`. Called once per page by the component's script. */
export function mountAbcTracks(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLElement>("[data-abc-track]").forEach(mountAbcTrack);
}
