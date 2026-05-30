/**
 * Centralized GameStore. Holds run-state + permanent-state references and
 * mediates between gameplay systems and UI panels.
 *
 * Permanent state lives inside SaveSystem; this store owns ephemeral run state
 * (party bucks, escape meter, owned shop levels for current run, combo, etc.)
 * and forwards events that UI listens to.
 */

import { EventBus } from './EventBus';
import type {
  BalloonTypeId,
  CosmeticCategory,
  FloatingTextRequest,
  HazardId,
  RunStats,
  SaveData,
  ShopItemId,
} from './types';
import { SaveSystem } from './SaveSystem';
import { emptyRunStats } from './Economy';

export interface RunState {
  partyBucks: number;
  escapeMeter: number;
  escapeMeterMax: number;
  combo: number;
  comboTimer: number;
  shopLevels: Partial<Record<ShopItemId, number>>;
  freeInstantsRemaining: Partial<Record<ShopItemId, number>>;
  activeBoosts: {
    speedFactor: number;
    speedTimer: number;
    comboDurationFactor: number;
    comboDurationTimer: number;
    cloudBlowerTimer: number;
    cloudBlockTimer: number;
  };
  activeHazards: Partial<Record<HazardId, number>>;
  hazardsExperienced: Set<HazardId>;
  stats: RunStats;
}

export interface StoreEvents {
  'run:start': void;
  'run:reset': void;
  'run:fail': { reason: string };
  'run:tick': { dt: number; elapsed: number };
  'partyBucks:change': { value: number; delta: number };
  'escape:change': { value: number; max: number };
  'combo:change': { combo: number; multiplier: number };
  'shop:purchase': { id: ShopItemId; level: number; cost: number };
  'shop:instant': { id: ShopItemId };
  'puppy:jump': void;
  'badge:unlock': { id: string };
  'stickerShine:change': { value: number; delta: number };
  'cosmetic:equip': { category: CosmeticCategory; id: string };
  'cosmetic:unlock': { id: string };
  'prestige:applied': { gain: number; total: number };
  'permanentBoost:unlock': { id: string };
  'floatingText:spawn': FloatingTextRequest;
  'screen:flash': { intensity: number };
  'hazard:start': { id: HazardId; duration: number };
  'hazard:end': { id: HazardId };
  'pop:registered': {
    type: BalloonTypeId;
    bucks: number;
    x: number;
    y: number;
    combo: number;
    isAuto: boolean;
  };
  'state:change': void;
}

export type BoostEffectLookup = (effectType: string) => number;

export class GameStore {
  readonly bus = new EventBus<StoreEvents>();
  readonly save: SaveSystem;
  run: RunState;
  private boostLookup: BoostEffectLookup;

  constructor(save?: SaveSystem, boostLookup?: BoostEffectLookup) {
    this.save = save ?? new SaveSystem();
    this.boostLookup = boostLookup ?? (() => 0);
    this.run = this.makeFreshRun();
  }

  setBoostLookup(fn: BoostEffectLookup): void {
    this.boostLookup = fn;
  }

  private makeFreshRun(): RunState {
    const baseMeterMax = 20;
    const safetyBoost = this.permanentBoostValue('starting_meter_safety');
    return {
      partyBucks: 0,
      escapeMeter: 0,
      escapeMeterMax: baseMeterMax + safetyBoost,
      combo: 0,
      comboTimer: 0,
      shopLevels: {},
      freeInstantsRemaining: {
        cloudBlower: this.permanentBoostValue('free_cloud_blower'),
        cakeFreeze: this.permanentBoostValue('free_cake_freeze'),
      },
      activeBoosts: {
        speedFactor: 1,
        speedTimer: 0,
        comboDurationFactor: 1,
        comboDurationTimer: 0,
        cloudBlowerTimer: 0,
        cloudBlockTimer: 0,
      },
      activeHazards: {},
      hazardsExperienced: new Set(),
      stats: emptyRunStats(performance.now()),
    };
  }

  resetRun(): void {
    this.run = this.makeFreshRun();
    this.bus.emit('run:reset', undefined);
    this.bus.emit('partyBucks:change', { value: 0, delta: 0 });
    this.bus.emit('escape:change', { value: 0, max: this.run.escapeMeterMax });
    this.bus.emit('combo:change', { combo: 0, multiplier: 1 });
  }

  startRun(): void {
    this.run.stats.startTime = performance.now();
    this.bus.emit('run:start', undefined);
  }

  failRun(reason: string): void {
    this.bus.emit('run:fail', { reason });
  }

  // ------ permanent boosts ------
  /**
   * Returns a stacked numeric value of all owned permanent boosts of the given
   * effect type. The actual lookup is injected via setBoostLookup() at boot
   * time so this module stays decoupled from data registries.
   */
  permanentBoostValue(effectType: string): number {
    return this.boostLookup(effectType);
  }

  // ------ persistent helpers ------
  updateSave(mutator: (s: SaveData) => void): void {
    this.save.update(mutator);
  }

  getSave(): SaveData {
    return this.save.data;
  }
}
