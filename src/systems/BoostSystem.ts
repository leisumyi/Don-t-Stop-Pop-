import type { GameStore } from '../core/GameStore';
import { PERMANENT_BOOSTS, permanentBoostEffectTotal } from '../data/boosts';

/**
 * BoostSystem mediates the permanent-boost catalog. Players spend Sticker
 * Shine to unlock boosts; once owned they apply forever.
 */
export class BoostSystem {
  constructor(private store: GameStore) {
    this.store.setBoostLookup((effectType) =>
      permanentBoostEffectTotal(this.store.save.data.permanentBoosts, effectType),
    );
  }

  list() {
    return PERMANENT_BOOSTS;
  }

  isOwned(id: string): boolean {
    return this.store.save.data.permanentBoosts.includes(id);
  }

  buy(id: string): boolean {
    const cfg = PERMANENT_BOOSTS.find((b) => b.id === id);
    if (!cfg) return false;
    if (this.isOwned(id)) return false;
    const save = this.store.save.data;
    if (save.stickerShine < cfg.cost) return false;
    this.store.updateSave((s) => {
      s.stickerShine -= cfg.cost;
      s.permanentBoosts.push(id);
    });
    this.store.bus.emit('stickerShine:change', {
      value: save.stickerShine,
      delta: -cfg.cost,
    });
    this.store.bus.emit('permanentBoost:unlock', { id });
    return true;
  }
}
