import type { GameStore } from '../core/GameStore';
import { comboMultiplier } from '../core/Economy';

const BASE_COMBO_TIMER = 2.0;

export class ComboSystem {
  constructor(private store: GameStore) {}

  /** Called by BalloonManager / popping pipeline on every successful pop. */
  registerPop(): void {
    const run = this.store.run;
    run.combo += 1;
    run.comboTimer = BASE_COMBO_TIMER * run.activeBoosts.comboDurationFactor;
    if (run.combo > run.stats.bestCombo) run.stats.bestCombo = run.combo;
    this.emit();
  }

  update(dt: number): void {
    const run = this.store.run;
    if (run.combo > 0) {
      run.comboTimer -= dt;
      if (run.comboTimer <= 0) {
        run.combo = 0;
        run.comboTimer = 0;
        this.emit();
      }
    }
    if (run.activeBoosts.comboDurationTimer > 0) {
      run.activeBoosts.comboDurationTimer -= dt;
      if (run.activeBoosts.comboDurationTimer <= 0) {
        run.activeBoosts.comboDurationFactor = 1;
      }
    }
  }

  reset(): void {
    const run = this.store.run;
    run.combo = 0;
    run.comboTimer = 0;
    this.emit();
  }

  private emit(): void {
    this.store.bus.emit('combo:change', {
      combo: this.store.run.combo,
      multiplier: comboMultiplier(this.store.run.combo),
    });
  }
}
