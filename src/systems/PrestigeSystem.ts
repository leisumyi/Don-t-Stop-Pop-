import type { GameStore } from '../core/GameStore';
import { calculatePrestigeGain, PRESTIGE_UNLOCK_THRESHOLD } from '../core/Economy';

/**
 * Owns the "Buy a New Party!" prestige flow. Visible-but-locked button is
 * always shown; `isUnlocked` becomes true once the player passes the
 * threshold in their current run.
 */
export class PrestigeSystem {
  constructor(private store: GameStore) {}

  get unlockThreshold(): number {
    return PRESTIGE_UNLOCK_THRESHOLD;
  }

  isUnlocked(): boolean {
    return this.store.run.partyBucks >= PRESTIGE_UNLOCK_THRESHOLD;
  }

  pendingGain(): number {
    return calculatePrestigeGain(this.store.run.partyBucks);
  }

  /**
   * Apply prestige and reset the run. Returns the gained multiplier delta.
   */
  apply(): number {
    if (!this.isUnlocked()) return 0;
    const gain = this.pendingGain();
    this.store.updateSave((s) => {
      s.partyMultiplier += gain;
      s.persistent.prestigeCount += 1;
    });
    this.store.bus.emit('prestige:applied', {
      gain,
      total: this.store.save.data.partyMultiplier,
    });
    return gain;
  }
}
