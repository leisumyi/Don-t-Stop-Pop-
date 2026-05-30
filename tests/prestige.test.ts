import { describe, expect, it } from 'vitest';
import { GameStore } from '../src/core/GameStore';
import { SaveSystem } from '../src/core/SaveSystem';
import { PrestigeSystem } from '../src/systems/PrestigeSystem';

function makeStore(): GameStore {
  const save = new SaveSystem(SaveSystem.memoryBackend(), { autoFlush: false });
  return new GameStore(save);
}

describe('PrestigeSystem', () => {
  it('is locked below 3000 party bucks', () => {
    const store = makeStore();
    const p = new PrestigeSystem(store);
    store.run.partyBucks = 2999;
    expect(p.isUnlocked()).toBe(false);
    expect(p.pendingGain()).toBe(0);
  });

  it('unlocks at exactly 3000 party bucks', () => {
    const store = makeStore();
    const p = new PrestigeSystem(store);
    store.run.partyBucks = 3000;
    expect(p.isUnlocked()).toBe(true);
    expect(p.pendingGain()).toBeCloseTo(0.05);
  });

  it('apply() adds to the persistent multiplier and increments prestige count', () => {
    const store = makeStore();
    const p = new PrestigeSystem(store);
    store.run.partyBucks = 9000;
    const gain = p.apply();
    expect(gain).toBeCloseTo(0.15);
    expect(store.save.data.partyMultiplier).toBeCloseTo(0.15);
    expect(store.save.data.persistent.prestigeCount).toBe(1);
  });

  it('stacks multiplier across multiple prestiges', () => {
    const store = makeStore();
    const p = new PrestigeSystem(store);
    store.run.partyBucks = 3000;
    p.apply();
    store.run.partyBucks = 4000;
    p.apply();
    // 0.05 + 0.10
    expect(store.save.data.partyMultiplier).toBeCloseTo(0.15);
    expect(store.save.data.persistent.prestigeCount).toBe(2);
  });

  it('apply() returns 0 and does nothing when locked', () => {
    const store = makeStore();
    const p = new PrestigeSystem(store);
    store.run.partyBucks = 500;
    expect(p.apply()).toBe(0);
    expect(store.save.data.partyMultiplier).toBe(0);
    expect(store.save.data.persistent.prestigeCount).toBe(0);
  });

  it('emits prestige:applied with the running total', () => {
    const store = makeStore();
    const p = new PrestigeSystem(store);
    let payload: { gain: number; total: number } | null = null;
    store.bus.on('prestige:applied', (e) => (payload = e));
    store.run.partyBucks = 3000;
    p.apply();
    expect(payload).not.toBeNull();
    expect(payload!.total).toBeCloseTo(0.05);
  });
});
