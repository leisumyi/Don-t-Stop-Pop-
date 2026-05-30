import type { GameStore } from '../core/GameStore';
import type { ShopItemId } from '../core/types';
import { SHOP_ITEMS, shopCost } from '../data/upgrades';
import type { HazardManager } from '../gameplay/HazardManager';
import type { EscapeMeter } from '../gameplay/EscapeMeter';
import type { BalloonManager } from '../gameplay/BalloonManager';
import type { PuppyActor } from '../gameplay/PuppyActor';

/** Fixed cadence (seconds) between Puppy Uppies jumps at every level. */
const PUPPY_INTERVAL = 4.0;

/**
 * ShopSystem owns the per-run upgrades. Idle items (Dart Thrower) keep a
 * level; instant items (Cloud Blower, Cake Freeze, Party Net) trigger and
 * cost money each use; temporary items (Combo Ribbon) trigger a buff.
 */
export class ShopSystem {
  private dartTimer = 0;
  private puppyTimer = 0;

  constructor(
    private store: GameStore,
    private balloons: BalloonManager,
    private escape: EscapeMeter,
    private hazards: HazardManager,
    private puppy: PuppyActor,
  ) {}

  getLevel(id: ShopItemId): number {
    return this.store.run.shopLevels[id] ?? 0;
  }

  /** Returns the next purchase cost for `id`. */
  cost(id: ShopItemId): number {
    const cfg = SHOP_ITEMS.find((s) => s.id === id);
    if (!cfg) return Infinity;
    if (cfg.kind === 'idle') return shopCost(id, this.getLevel(id));
    return cfg.baseCost;
  }

  isMaxed(id: ShopItemId): boolean {
    const cfg = SHOP_ITEMS.find((s) => s.id === id);
    if (!cfg) return false;
    return this.getLevel(id) >= cfg.maxLevel;
  }

  canAfford(id: ShopItemId): boolean {
    if (this.isMaxed(id)) return false;
    return this.store.run.partyBucks >= this.cost(id);
  }

  /**
   * Attempts a purchase. Returns true if the purchase succeeded.
   */
  buy(id: ShopItemId): boolean {
    const cfg = SHOP_ITEMS.find((s) => s.id === id);
    if (!cfg) return false;
    if (this.isMaxed(id)) return false;

    // Cloud Blower / Cake Freeze can use a free instant first.
    const free = (this.store.run.freeInstantsRemaining[id] ?? 0) > 0;
    const c = free ? 0 : this.cost(id);
    if (!free && this.store.run.partyBucks < c) return false;

    if (free) {
      this.store.run.freeInstantsRemaining[id] = (this.store.run.freeInstantsRemaining[id] ?? 0) - 1;
    } else {
      this.spendBucks(c);
    }
    this.applyEffect(id);

    if (cfg.kind === 'idle') {
      this.store.run.shopLevels[id] = this.getLevel(id) + 1;
      this.store.run.stats.toolsOwned = Math.max(
        this.store.run.stats.toolsOwned,
        Object.values(this.store.run.shopLevels).filter((v) => (v ?? 0) > 0).length,
      );
    } else if (cfg.kind === 'instant') {
      this.store.run.stats.instantsUsed += 1;
      this.store.bus.emit('shop:instant', { id });
    }

    this.store.run.stats.shopItemsPurchased += 1;
    this.store.bus.emit('shop:purchase', { id, level: this.getLevel(id), cost: c });
    return true;
  }

  /** Mutates partyBucks and emits the change event. */
  private spendBucks(amount: number): void {
    const before = this.store.run.partyBucks;
    this.store.run.partyBucks = Math.max(0, before - amount);
    this.store.bus.emit('partyBucks:change', {
      value: this.store.run.partyBucks,
      delta: this.store.run.partyBucks - before,
    });
  }

  private applyEffect(id: ShopItemId): void {
    switch (id) {
      case 'dartThrower':
        // Effect is applied each frame in update()
        break;
      case 'cloudBlower':
        this.hazards.triggerCloudBlower(8, 5);
        break;
      case 'cakeFreeze':
        this.hazards.triggerCakeFreeze(5);
        break;
      case 'partyNet':
        this.escape.reduce(5);
        break;
      case 'comboRibbon':
        this.hazards.triggerComboRibbon(20, 1.3);
        break;
    }
  }

  /** Driven by GameLoop. Handles Dart Thrower + Puppy Uppies auto-pops. */
  update(
    dt: number,
    idleSpeedBonus: number,
    popCallback: (b: ReturnType<BalloonManager['popAt']>, source: 'dart' | 'puppy') => void,
  ): void {
    this.updateDartThrower(dt, idleSpeedBonus, popCallback);
    this.updatePuppyUppies(dt, popCallback);
  }

  private updateDartThrower(
    dt: number,
    idleSpeedBonus: number,
    popCallback: (b: ReturnType<BalloonManager['popAt']>, source: 'dart' | 'puppy') => void,
  ): void {
    const dartLevel = this.getLevel('dartThrower');
    if (dartLevel <= 0) return;
    const cfg = SHOP_ITEMS.find((s) => s.id === 'dartThrower');
    if (!cfg || !cfg.effectByLevel) return;
    const baseInterval = cfg.effectByLevel[dartLevel] ?? cfg.effectByLevel[1];
    const interval = baseInterval / (1 + idleSpeedBonus);
    this.dartTimer -= dt;
    if (this.dartTimer > 0) return;
    this.dartTimer = interval;
    const target = this.balloons.pickPriorityTarget();
    if (target) {
      target.hit();
      popCallback(target, 'dart');
    }
  }

  private updatePuppyUppies(
    dt: number,
    popCallback: (b: ReturnType<BalloonManager['popAt']>, source: 'dart' | 'puppy') => void,
  ): void {
    const puppyLevel = this.getLevel('puppyUppies');
    if (puppyLevel <= 0) return;
    this.puppyTimer -= dt;
    if (this.puppyTimer > 0) return;
    this.puppyTimer = PUPPY_INTERVAL;
    const targets = this.balloons.pickLowest(puppyLevel);
    if (targets.length === 0) return;
    const avgX = targets.reduce((sum, b) => sum + b.position.x, 0) / targets.length;
    this.store.bus.emit('puppy:jump', undefined);
    this.puppy.jump(avgX, () => {
      for (const b of targets) {
        if (!b.popped) {
          b.hit();
          popCallback(b, 'puppy');
        }
      }
    });
  }

  reset(): void {
    this.dartTimer = 0;
    this.puppyTimer = 0;
    this.puppy.reset();
  }
}
