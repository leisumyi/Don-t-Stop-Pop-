import { describe, expect, it } from 'vitest';
import { GameStore } from '../src/core/GameStore';
import { SaveSystem } from '../src/core/SaveSystem';
import { BadgeSystem } from '../src/systems/BadgeSystem';
import { BADGES } from '../src/data/badges';

function makeStore(): GameStore {
  const save = new SaveSystem(SaveSystem.memoryBackend(), { autoFlush: false });
  return new GameStore(save);
}

describe('BadgeSystem', () => {
  it('unlocks the first-pop badge once a balloon is popped', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.updateSave((s) => {
      s.persistent.totalBalloonsPopped = 1;
    });
    const newly = sys.evaluate();
    expect(newly).toContain('first_pop');
    expect(store.save.data.badgesUnlocked).toContain('first_pop');
  });

  it('does not award sticker shine on unlock (shine comes from cleaning)', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.updateSave((s) => {
      s.persistent.totalBalloonsPopped = 1;
    });
    sys.evaluate();
    expect(store.save.data.badgesUnlocked).toContain('first_pop');
    expect(store.save.data.stickerShine).toBe(0);
  });

  it('does not unlock the same badge twice', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.updateSave((s) => {
      s.persistent.totalBalloonsPopped = 100;
    });
    const first = sys.evaluate();
    const second = sys.evaluate();
    expect(first).toContain('pop_100');
    expect(second).not.toContain('pop_100');
  });

  it('unlocks combo badges from run best combo', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.run.stats.bestCombo = 10;
    const newly = sys.evaluate();
    expect(newly).toContain('combo_x10');
    expect(newly).toContain('combo_x5');
  });

  it('unlocks survive-hazard badges from experienced hazards', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.run.hazardsExperienced.add('windstorm');
    const newly = sys.evaluate();
    expect(newly).toContain('survive_windstorm');
  });

  it('unlocks the close-call badge only when meter pct is high at fail', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    expect(sys.evaluate({ lostMeterPctAtFail: 50 })).not.toContain('close_call');
    expect(sys.evaluate({ lostMeterPctAtFail: 96 })).toContain('close_call');
  });

  it('unlocks prestige badges from prestige count', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.updateSave((s) => {
      s.persistent.prestigeCount = 1;
    });
    expect(sys.evaluate()).toContain('prestige_1');
  });

  it('initializes cleaning state on badge unlock', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.updateSave((s) => {
      s.persistent.totalBalloonsPopped = 1;
    });
    sys.evaluate();
    const state = store.save.data.badgeCleaningState['first_pop'];
    expect(state).toBeDefined();
    expect(state.cleaningRequired).toBeGreaterThanOrEqual(5);
    expect(state.cleaningRequired).toBeLessThanOrEqual(10);
    expect(state.cleaningProgress).toBe(0);
  });

  it('incremental clean progresses and awards shine on completion', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.updateSave((s) => {
      s.badgesUnlocked.push('first_pop');
      s.badgeCleaningState['first_pop'] = { cleaningRequired: 3, cleaningProgress: 0 };
      s.stickerShine = 0;
    });
    const cfg = BADGES.find((b) => b.id === 'first_pop')!;

    const r1 = sys.clean('first_pop')!;
    expect(r1.progress).toBe(1);
    expect(r1.justCompleted).toBe(false);
    expect(store.save.data.stickerShine).toBe(0);

    sys.clean('first_pop');
    const r3 = sys.clean('first_pop')!;
    expect(r3.justCompleted).toBe(true);
    expect(store.save.data.badgesCleaned).toContain('first_pop');
    expect(store.save.data.stickerShine).toBe(cfg.rewardStickerShine);
  });

  it('clean returns null for already cleaned badge', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.updateSave((s) => {
      s.badgesUnlocked.push('first_pop');
      s.badgesCleaned.push('first_pop');
    });
    expect(sys.clean('first_pop')).toBeNull();
  });

  it('polish bonus value sums across cleaned badges', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    store.updateSave((s) => {
      s.badgesCleaned.push('first_pop'); // party_bucks_bonus 0.01
      s.badgesCleaned.push('pop_100'); // party_bucks_bonus 0.01
    });
    expect(sys.getPolishBonusValue('party_bucks_bonus')).toBeCloseTo(0.02);
  });

  it('unlockAll unlocks every badge in dirty state', () => {
    const store = makeStore();
    const sys = new BadgeSystem(store);
    const newly = sys.unlockAll();
    expect(newly).toHaveLength(BADGES.length);
    expect(store.save.data.badgesUnlocked).toHaveLength(BADGES.length);
    expect(store.save.data.badgesCleaned).toHaveLength(0);
    for (const cfg of BADGES) {
      expect(store.save.data.badgeCleaningState[cfg.id]?.cleaningProgress).toBe(0);
    }
    expect(sys.unlockAll()).toHaveLength(0);
  });
});
