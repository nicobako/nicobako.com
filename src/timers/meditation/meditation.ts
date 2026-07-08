/**
 * Tracks which interval-bell boundaries have been rung during a session,
 * given the total session length and the remaining time on each tick.
 * Pairs with src/timers/shared/countdown.ts's `Countdown`.
 */
export class BellTracker {
  private rungCount = 0;

  constructor(
    private readonly totalMs: number,
    private readonly intervalMs: number,
  ) {}

  /** Call on every tick with the remaining ms. Returns true if a bell should ring now. */
  checkBell(remainingMs: number): boolean {
    if (this.intervalMs <= 0) return false;
    const elapsedMs = this.totalMs - remainingMs;
    // The final boundary coincides with session end, which the end bell covers.
    if (elapsedMs >= this.totalMs) return false;
    const expectedRung = Math.floor(elapsedMs / this.intervalMs);
    if (expectedRung > this.rungCount) {
      this.rungCount = expectedRung;
      return true;
    }
    return false;
  }
}
