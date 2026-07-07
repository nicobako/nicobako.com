import abcjs from "abcjs";
import type { SynthObjectController } from "abcjs";
import "abcjs/abcjs-audio.css";

export interface AbcEditorTargets {
  notation: HTMLElement;
  audio: HTMLElement;
  warnings: HTMLElement;
}

export class AbcEditor {
  private notation: HTMLElement;
  private warnings: HTMLElement;
  private synthControl: SynthObjectController | null = null;

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
    const tune = tunes[0];

    this.warnings.textContent = tune?.warnings?.length
      ? tune.warnings.map((w) => w.replace(/<\/?[^>]+>/g, "")).join("\n")
      : "";

    if (this.synthControl && tune) {
      void this.synthControl.setTune(tune, false, {});
    }
  }
}
