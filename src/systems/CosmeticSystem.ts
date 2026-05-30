import type { CosmeticCategory } from '../core/types';
import type { GameStore } from '../core/GameStore';
import { COSMETICS, DEFAULT_EQUIPPED } from '../data/cosmetics';

/**
 * Owns cosmetic ownership + equipped-state. Default cosmetics (cost = 0) are
 * automatically owned + equipped on first run.
 */
export class CosmeticSystem {
  private listeners = new Set<() => void>();

  constructor(private store: GameStore) {
    this.ensureDefaults();
  }

  ensureDefaults(): void {
    let dirty = false;
    this.store.updateSave((s) => {
      for (const c of COSMETICS) {
        if (c.cost === 0 && !s.cosmeticsOwned.includes(c.id)) {
          s.cosmeticsOwned.push(c.id);
          dirty = true;
        }
      }
      for (const [cat, id] of Object.entries(DEFAULT_EQUIPPED)) {
        const key = cat as CosmeticCategory;
        if (!s.cosmeticsEquipped[key]) {
          s.cosmeticsEquipped[key] = id;
          dirty = true;
        }
      }
    });
    if (dirty) this.notify();
  }

  list(category: CosmeticCategory) {
    return COSMETICS.filter((c) => c.category === category);
  }

  isOwned(id: string): boolean {
    return this.store.save.data.cosmeticsOwned.includes(id);
  }

  equippedIn(category: CosmeticCategory): string | undefined {
    return this.store.save.data.cosmeticsEquipped[category];
  }

  buy(id: string): boolean {
    const cfg = COSMETICS.find((c) => c.id === id);
    if (!cfg) return false;
    if (this.isOwned(id)) return false;
    const save = this.store.save.data;
    if (save.stickerShine < cfg.cost) return false;
    this.store.updateSave((s) => {
      s.stickerShine -= cfg.cost;
      s.cosmeticsOwned.push(id);
    });
    this.store.bus.emit('stickerShine:change', {
      value: save.stickerShine,
      delta: -cfg.cost,
    });
    this.store.bus.emit('cosmetic:unlock', { id });
    this.notify();
    return true;
  }

  equip(id: string): boolean {
    const cfg = COSMETICS.find((c) => c.id === id);
    if (!cfg) return false;
    if (!this.isOwned(id)) return false;
    this.store.updateSave((s) => {
      s.cosmeticsEquipped[cfg.category] = id;
    });
    this.store.bus.emit('cosmetic:equip', { category: cfg.category, id });
    this.notify();
    return true;
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
