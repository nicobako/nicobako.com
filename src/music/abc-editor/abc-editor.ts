import abcjs from "abcjs";
import type { SynthObjectController, TuneObject } from "abcjs";
import "abcjs/abcjs-audio.css";

export interface AbcEditorTargets {
  notation: HTMLElement;
  audio: HTMLElement;
  warnings: HTMLElement;
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function fileBaseName(tune: TuneObject | null): string {
  const title = tune?.metaText?.title?.trim();
  const slug = title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "tune";
}

export class AbcEditor {
  private notation: HTMLElement;
  private warnings: HTMLElement;
  private synthControl: SynthObjectController | null = null;
  private tune: TuneObject | null = null;

  constructor({ notation, audio, warnings }: AbcEditorTargets) {
    this.notation = notation;
    this.warnings = warnings;

    if (abcjs.synth.supportsAudio()) {
      this.synthControl = new abcjs.synth.SynthController();
      this.synthControl.load(audio, undefined, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: false,
      });
    } else {
      audio.textContent = "Audio playback isn't supported in this browser.";
    }
  }

  render(abc: string): void {
    const tunes = abcjs.renderAbc(this.notation, abc, { responsive: "resize" });
    const tune = tunes[0] ?? null;
    this.tune = tune;

    this.warnings.textContent = tune?.warnings?.length
      ? tune.warnings.map((w) => w.replace(/<\/?[^>]+>/g, "")).join("\n")
      : "";

    if (this.synthControl && tune) {
      void this.synthControl.setTune(tune, false, {});
      // abcjs's SynthController only primes audio for a tune the first time
      // Play is pressed: setTune() never clears the isLoaded/isLoading flags
      // it sets during that first priming, so without this, editing after
      // playing once would keep playing (or, if a note ever failed to load,
      // get permanently stuck "loading") the stale tune. Reset both so the
      // next Play re-primes against the tune we just rendered.
      const internal = this.synthControl as unknown as { isLoaded: boolean; isLoading: boolean };
      internal.isLoaded = false;
      internal.isLoading = false;
    }
  }

  downloadAbcText(abc: string): void {
    const blob = new Blob([abc], { type: "text/plain;charset=utf-8" });
    triggerDownload(URL.createObjectURL(blob), `${fileBaseName(this.tune)}.abc`);
  }

  async downloadWav(): Promise<void> {
    if (!this.tune) return;
    const midiBuffer = new abcjs.synth.CreateSynth();
    await midiBuffer.init({ visualObj: this.tune });
    await midiBuffer.prime();
    triggerDownload(midiBuffer.download(), `${fileBaseName(this.tune)}.wav`);
  }

  downloadMidi(): void {
    if (!this.tune) return;
    const bytes = abcjs.synth.getMidiFile(this.tune, { midiOutputType: "binary" }) as Uint8Array<ArrayBuffer>;
    const blob = new Blob([bytes], { type: "audio/midi" });
    triggerDownload(URL.createObjectURL(blob), `${fileBaseName(this.tune)}.midi`);
  }
}
