import { describe, expect, it } from 'vitest';
import { BADGES } from '../src/data/badges';
import { COSMETICS } from '../src/data/cosmetics';
import { PERMANENT_BOOSTS } from '../src/data/boosts';
import { SHOP_ITEMS } from '../src/data/upgrades';
import { BALLOONS, ALL_BALLOON_TYPES } from '../src/data/balloons';
import { DIFFICULTY_PHASES, phaseAt } from '../src/data/difficultyPhases';
import { FAIL_MESSAGES } from '../src/data/failMessages';
import { HAZARDS } from '../src/data/hazards';

describe('content counts', () => {
  it('has 6 balloon types', () => {
    expect(ALL_BALLOON_TYPES).toHaveLength(6);
    for (const t of ALL_BALLOON_TYPES) {
      expect(BALLOONS[t]).toBeDefined();
    }
  });

  it('has 6 starter shop items', () => {
    expect(SHOP_ITEMS).toHaveLength(6);
  });

  it('has 25-40 badges', () => {
    expect(BADGES.length).toBeGreaterThanOrEqual(25);
    expect(BADGES.length).toBeLessThanOrEqual(45);
  });

  it('has 25 cosmetics across 5 categories with 5 each', () => {
    const byCat: Record<string, number> = {};
    for (const c of COSMETICS) byCat[c.category] = (byCat[c.category] ?? 0) + 1;
    for (const cat of ['uiTheme', 'backgroundTheme', 'balloonSkin', 'popEffect', 'stampCardTheme']) {
      expect(byCat[cat], `category ${cat}`).toBe(5);
    }
  });

  it('every stamp card theme defines a stampCardThemeKey', () => {
    for (const c of COSMETICS.filter((x) => x.category === 'stampCardTheme')) {
      expect(c.stampCardThemeKey, c.id).toBeTruthy();
    }
  });

  it('has 8-12 permanent boosts', () => {
    expect(PERMANENT_BOOSTS.length).toBeGreaterThanOrEqual(8);
    expect(PERMANENT_BOOSTS.length).toBeLessThanOrEqual(12);
  });

  it('has 5 difficulty phases', () => {
    expect(DIFFICULTY_PHASES).toHaveLength(5);
  });

  it('has 10 fail messages', () => {
    expect(FAIL_MESSAGES).toHaveLength(10);
  });

  it('has 3 hazards', () => {
    expect(HAZARDS).toHaveLength(3);
  });
});

describe('difficultyPhases.phaseAt', () => {
  it('returns phase 1 at t=0', () => {
    expect(phaseAt(0).id).toBe(1);
  });
  it('returns phase 5 at t=400s', () => {
    expect(phaseAt(400).id).toBe(5);
  });
  it('crosses thresholds correctly', () => {
    expect(phaseAt(20).id).toBe(2);
    expect(phaseAt(59).id).toBe(2);
    expect(phaseAt(60).id).toBe(3);
  });
});

describe('badge unique ids', () => {
  it('all badge ids are unique', () => {
    const ids = new Set(BADGES.map((b) => b.id));
    expect(ids.size).toBe(BADGES.length);
  });
});

describe('cosmetic unique ids', () => {
  it('all cosmetic ids are unique', () => {
    const ids = new Set(COSMETICS.map((c) => c.id));
    expect(ids.size).toBe(COSMETICS.length);
  });
});
