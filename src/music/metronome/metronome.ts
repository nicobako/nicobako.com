export interface BeatEvent {
  number: number;
  audible: boolean;
}

export class Metronome {
  bpm = 52;
  skipPercent = 0;

  private ctx: AudioContext | null = null;
  private nextBeatTime = 0;
  private beatCount = 0;
  private schedulerId: ReturnType<typeof setInterval> | null = null;

  private readonly onBeat: (e: BeatEvent) => void;
  private readonly lookahead = 0.1;
  private readonly scheduleInterval = 25;

  constructor(onBeat: (e: BeatEvent) => void) {
    this.onBeat = onBeat;
  }

  get isPlaying(): boolean {
    return this.schedulerId !== null;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  start(): void {
    if (this.isPlaying) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    } else if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    this.beatCount = 0;
    this.nextBeatTime = this.ctx.currentTime;
    this.schedulerId = setInterval(() => this.schedule(), this.scheduleInterval);
  }

  stop(): void {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private schedule(): void {
    const ctx = this.ctx!;
    const secondsPerBeat = 60 / this.bpm;

    while (this.nextBeatTime < ctx.currentTime + this.lookahead) {
      const audible = Math.random() >= this.skipPercent / 100;
      const event: BeatEvent = { number: this.beatCount, audible };
      if (audible) this.playClick(this.nextBeatTime);
      this.scheduleVisual(this.nextBeatTime, event);
      this.nextBeatTime += secondsPerBeat;
      this.beatCount++;
    }
  }

  private playClick(time: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  private scheduleVisual(time: number, event: BeatEvent): void {
    const delay = (time - this.ctx!.currentTime) * 1000;
    setTimeout(() => this.onBeat(event), Math.max(0, delay));
  }
}
