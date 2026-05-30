import { describe, expect, it } from 'vitest';
import { GameStore } from '../src/core/GameStore';
import { SaveSystem } from '../src/core/SaveSystem';
import { EscapeMeter } from '../src/gameplay/EscapeMeter';
import { ESCAPE_METER_BASE_MAX } from '../src/data/balloons';

function makeStore(): GameStore {
  const save = new SaveSystem(SaveSystem.memoryBackend(), { autoFlush: false });
  return new GameStore(save);
}

describe('EscapeMeter', () => {
  it('starts at 0', () => {
    const store = makeStore();
    const m = new EscapeMeter(store, () => {});
    expect(store.run.escapeMeter).toBe(0);
    expect(m.ratio).toBe(0);
  });

  it('uses base max from data + permanent boost safety', () => {
    const store = makeStore();
    expect(store.run.escapeMeterMax).toBe(ESCAPE_METER_BASE_MAX);
  });

  it('addEscape applies the per-type escape value', () => {
    const store = makeStore();
    const m = new EscapeMeter(store, () => {});
    m.addEscape('normal');
    expect(store.run.escapeMeter).toBe(1);
    m.addEscape('fineRisk');
    expect(store.run.escapeMeter).toBe(6);
  });

  it('fires onFail exactly once when meter hits max', () => {
    const store = makeStore();
    let failCount = 0;
    const m = new EscapeMeter(store, () => failCount++);
    for (let i = 0; i < 25; i++) m.addEscape('normal');
    expect(failCount).toBe(1);
    expect(store.run.escapeMeter).toBe(store.run.escapeMeterMax);
  });

  it('reduce() respects 0 floor', () => {
    const store = makeStore();
    const m = new EscapeMeter(store, () => {});
    m.add(3);
    m.reduce(10);
    expect(store.run.escapeMeter).toBe(0);
  });

  it('reset() clears state and re-arms onFail', () => {
    const store = makeStore();
    let fails = 0;
    const m = new EscapeMeter(store, () => fails++);
    m.add(store.run.escapeMeterMax);
    expect(fails).toBe(1);
    m.reset();
    m.add(store.run.escapeMeterMax);
    expect(fails).toBe(2);
  });
});
