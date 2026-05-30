import { describe, expect, it } from 'vitest';
import { DIFFICULTY_PHASES, phaseAt } from '../src/data/difficultyPhases';
import { HAZARDS } from '../src/data/hazards';

describe('difficulty phases content', () => {
  it('starts cozy in phase 1 (normal balloons only, no hazards)', () => {
    const p1 = DIFFICULTY_PHASES[0];
    expect(p1.id).toBe(1);
    expect(p1.enabledTypes).toEqual(['normal']);
    expect(p1.enabledHazards).toEqual([]);
  });

  it('introduces windstorm in phase 3', () => {
    const p3 = DIFFICULTY_PHASES.find((p) => p.id === 3)!;
    expect(p3.enabledHazards).toContain('windstorm');
  });

  it('introduces cloud cover and birthday rush in phase 4', () => {
    const p4 = DIFFICULTY_PHASES.find((p) => p.id === 4)!;
    expect(p4.enabledHazards).toContain('cloudCover');
    expect(p4.enabledHazards).toContain('birthdayRush');
    expect(p4.enabledTypes).toContain('golden');
  });

  it('introduces tank balloons in phase 3', () => {
    const p3 = DIFFICULTY_PHASES.find((p) => p.id === 3)!;
    expect(p3.enabledTypes).toContain('tank');
  });

  it('introduces fineRisk balloons in phase 5', () => {
    const p5 = DIFFICULTY_PHASES.find((p) => p.id === 5)!;
    expect(p5.enabledTypes).toContain('fineRisk');
  });

  it('spawn intervals decrease across phases', () => {
    for (let i = 1; i < DIFFICULTY_PHASES.length; i++) {
      expect(DIFFICULTY_PHASES[i].spawnInterval).toBeLessThanOrEqual(
        DIFFICULTY_PHASES[i - 1].spawnInterval,
      );
    }
  });

  it('max concurrent balloons grows across phases', () => {
    for (let i = 1; i < DIFFICULTY_PHASES.length; i++) {
      expect(DIFFICULTY_PHASES[i].maxConcurrent).toBeGreaterThanOrEqual(
        DIFFICULTY_PHASES[i - 1].maxConcurrent,
      );
    }
  });

  it('phaseAt returns the latest phase whose startTime has elapsed', () => {
    expect(phaseAt(0).id).toBe(1);
    expect(phaseAt(19).id).toBe(1);
    expect(phaseAt(20).id).toBe(2);
    expect(phaseAt(59).id).toBe(2);
    expect(phaseAt(60).id).toBe(3);
    expect(phaseAt(109).id).toBe(3);
    expect(phaseAt(110).id).toBe(4);
    expect(phaseAt(179).id).toBe(4);
    expect(phaseAt(180).id).toBe(5);
    expect(phaseAt(9999).id).toBe(5);
  });
});

describe('hazards content', () => {
  it('has all 3 hazards with finite duration + cooldown', () => {
    expect(HAZARDS.map((h) => h.id).sort()).toEqual(['birthdayRush', 'cloudCover', 'windstorm']);
    for (const h of HAZARDS) {
      expect(h.duration).toBeGreaterThan(0);
      expect(h.cooldown).toBeGreaterThan(0);
      expect(h.duration).toBeLessThan(h.cooldown);
    }
  });
});
