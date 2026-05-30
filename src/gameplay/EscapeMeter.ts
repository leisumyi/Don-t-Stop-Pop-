import type { GameStore } from '../core/GameStore';
import type { BalloonTypeId } from '../core/types';
import { BALLOONS } from '../data/balloons';

/**
 * Tracks the Balloon Escape Meter. Caller adds escape points via addEscape();
 * if the meter hits max we transition to FAILED via the supplied callback.
 */
export class EscapeMeter {
  private failTriggered = false;

  constructor(
    private store: GameStore,
    private onFail: () => void,
  ) {}

  addEscape(type: BalloonTypeId): void {
    const cfg = BALLOONS[type];
    this.add(cfg.escapeValue);
  }

  add(amount: number): void {
    if (this.failTriggered) return;
    const run = this.store.run;
    run.escapeMeter = Math.min(run.escapeMeterMax, run.escapeMeter + amount);
    this.store.bus.emit('escape:change', {
      value: run.escapeMeter,
      max: run.escapeMeterMax,
    });
    if (run.escapeMeter >= run.escapeMeterMax) {
      this.failTriggered = true;
      this.store.bus.emit('screen:flash', { intensity: 1 });
      this.onFail();
    }
  }

  reduce(amount: number): void {
    const run = this.store.run;
    run.escapeMeter = Math.max(0, run.escapeMeter - amount);
    this.store.bus.emit('escape:change', {
      value: run.escapeMeter,
      max: run.escapeMeterMax,
    });
  }

  reset(): void {
    this.failTriggered = false;
    const run = this.store.run;
    run.escapeMeter = 0;
    this.store.bus.emit('escape:change', {
      value: run.escapeMeter,
      max: run.escapeMeterMax,
    });
  }

  /** 0..1 fill ratio for UI/danger calculations. */
  get ratio(): number {
    const run = this.store.run;
    return run.escapeMeterMax > 0 ? run.escapeMeter / run.escapeMeterMax : 0;
  }
}
