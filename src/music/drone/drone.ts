export interface Note {
  name: string;
  label: string;
  freq: number;
  isBlack: boolean;
}

function hz(semitones: number): number {
  return 440 * Math.pow(2, semitones / 12);
}

export const NOTES: readonly Note[] = [
  { name: 'C4',  label: 'C',  freq: hz(-9), isBlack: false },
  { name: 'Cs4', label: 'C♯', freq: hz(-8), isBlack: true  },
  { name: 'D4',  label: 'D',  freq: hz(-7), isBlack: false },
  { name: 'Ds4', label: 'D♯', freq: hz(-6), isBlack: true  },
  { name: 'E4',  label: 'E',  freq: hz(-5), isBlack: false },
  { name: 'F4',  label: 'F',  freq: hz(-4), isBlack: false },
  { name: 'Fs4', label: 'F♯', freq: hz(-3), isBlack: true  },
  { name: 'G4',  label: 'G',  freq: hz(-2), isBlack: false },
  { name: 'Gs4', label: 'G♯', freq: hz(-1), isBlack: true  },
  { name: 'A4',  label: 'A',  freq: hz(0),  isBlack: false },
  { name: 'As4', label: 'A♯', freq: hz(1),  isBlack: true  },
  { name: 'B4',  label: 'B',  freq: hz(2),  isBlack: false },
  { name: 'C5',  label: 'C5', freq: hz(3),  isBlack: false },
];

export class Drone {
  private ctx: AudioContext | null = null;
  private out: AudioNode | null = null;
  private sustained = new Map<string, { osc: OscillatorNode; gain: GainNode }>();

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const comp = this.ctx.createDynamicsCompressor();
      comp.connect(this.ctx.destination);
      this.out = comp;
    } else if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  pluck(freq: number): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.out!);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    // Ramp up from 0 to avoid the click of an abrupt waveform start
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    osc.start(now);
    osc.stop(now + 2.5);
  }

  startNote(name: string, freq: number): void {
    if (this.sustained.has(name)) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.out!);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.015);
    osc.start(now);
    this.sustained.set(name, { osc, gain });
  }

  stopNote(name: string): void {
    const node = this.sustained.get(name);
    if (!node) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    // Cancel pending automation before scheduling the release to avoid discontinuities
    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(node.gain.gain.value, now);
    node.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    node.osc.stop(now + 0.1);
    this.sustained.delete(name);
  }

  stopAll(): void {
    for (const name of [...this.sustained.keys()]) {
      this.stopNote(name);
    }
  }
}
