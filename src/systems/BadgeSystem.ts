import type { BadgeConfig, BadgeDifficulty, BalloonTypeId, HazardId } from '../core/types';
import type { GameStore } from '../core/GameStore';
import { BADGES } from '../data/badges';

export interface CleanResult {
  progress: number;
  required: number;
  justCompleted: boolean;
}

/**
 * Tracks badge progress, unlock + cleaning, and Sticker Shine awarding.
 *
 * When a badge unlocks it enters the "dirty" state with a random cleaning
 * requirement (5-10 taps, scaled by difficulty). The player cleans it
 * incrementally via `clean()` calls from the StampCardPanel.
 */
export class BadgeSystem {
  constructor(private store: GameStore) {}

  /**
   * Recompute all unlock conditions from current state. Returns the array of
   * newly unlocked badge ids (so UI can show toasts for them).
   */
  evaluate(opts: { lostMeterPctAtFail?: number } = {}): string[] {
    const newlyUnlocked: string[] = [];
    const save = this.store.save.data;
    const run = this.store.run;

    for (const id of run.hazardsExperienced) {
      if (!run.stats.hazardsSurvived.includes(id)) {
        run.stats.hazardsSurvived.push(id);
      }
    }

    for (const cfg of BADGES) {
      if (save.badgesUnlocked.includes(cfg.id)) continue;
      if (this.matches(cfg, opts)) {
        save.badgesUnlocked.push(cfg.id);
        save.badgeCleaningState[cfg.id] = {
          cleaningRequired: this.rollCleaningRequirement(cfg.difficulty),
          cleaningProgress: 0,
        };
        newlyUnlocked.push(cfg.id);
        this.store.bus.emit('badge:unlock', { id: cfg.id });
      }
    }
    if (newlyUnlocked.length > 0) {
      this.store.updateSave(() => {});
    }
    return newlyUnlocked;
  }

  private rollCleaningRequirement(difficulty: BadgeDifficulty): number {
    switch (difficulty) {
      case 'easy':
        return 5 + Math.floor(Math.random() * 2); // 5-6
      case 'medium':
        return 6 + Math.floor(Math.random() * 3); // 6-8
      case 'hard':
        return 8 + Math.floor(Math.random() * 3); // 8-10
      case 'legendary':
        return 10;
    }
  }

  /**
   * Increment cleaning progress for a dirty badge. Returns the current state
   * including whether the badge just became fully clean.
   */
  clean(badgeId: string): CleanResult | null {
    const save = this.store.save.data;
    if (!save.badgesUnlocked.includes(badgeId)) return null;
    if (save.badgesCleaned.includes(badgeId)) return null;

    // Lazily initialize cleaning state for badges unlocked before v2 migration
    if (!save.badgeCleaningState[badgeId]) {
      const cfg = BADGES.find((b) => b.id === badgeId);
      save.badgeCleaningState[badgeId] = {
        cleaningRequired: this.rollCleaningRequirement(cfg?.difficulty ?? 'medium'),
        cleaningProgress: 0,
      };
    }
    const state = save.badgeCleaningState[badgeId];

    state.cleaningProgress = Math.min(state.cleaningProgress + 1, state.cleaningRequired);
    const justCompleted = state.cleaningProgress >= state.cleaningRequired;

    if (justCompleted) {
      const cfg = BADGES.find((b) => b.id === badgeId);
      if (cfg) {
        save.badgesCleaned.push(badgeId);
        save.stickerShine += cfg.rewardStickerShine;
        this.store.bus.emit('stickerShine:change', {
          value: save.stickerShine,
          delta: cfg.rewardStickerShine,
        });
      }
    }

    this.store.updateSave(() => {});
    return {
      progress: state.cleaningProgress,
      required: state.cleaningRequired,
      justCompleted,
    };
  }

  /** Lazily creates cleaning state for a badge that was unlocked before the v2 save migration. */
  ensureCleaningState(badgeId: string): void {
    const save = this.store.save.data;
    if (save.badgeCleaningState[badgeId]) return;
    const cfg = BADGES.find((b) => b.id === badgeId);
    save.badgeCleaningState[badgeId] = {
      cleaningRequired: this.rollCleaningRequirement(cfg?.difficulty ?? 'medium'),
      cleaningProgress: 0,
    };
    this.store.updateSave(() => {});
  }

  getCleaningState(badgeId: string): { progress: number; required: number } | null {
    const state = this.store.save.data.badgeCleaningState[badgeId];
    if (!state) return null;
    return { progress: state.cleaningProgress, required: state.cleaningRequired };
  }

  private matches(cfg: BadgeConfig, opts: { lostMeterPctAtFail?: number }): boolean {
    const save = this.store.save.data;
    const run = this.store.run;
    const persist = save.persistent;

    switch (cfg.requirementType) {
      case 'total_balloons_popped':
        return persist.totalBalloonsPopped >= cfg.requirementValue;
      case 'total_party_bucks_earned':
        return persist.totalPartyBucksEarned >= cfg.requirementValue;
      case 'balloons_popped_by_type':
        if (!cfg.requirementSubject) return false;
        return (
          (persist.totalBalloonsByType[cfg.requirementSubject as BalloonTypeId] ?? 0) >=
          cfg.requirementValue
        );
      case 'survive_seconds_in_run':
        return run.stats.elapsed >= cfg.requirementValue;
      case 'survive_hazard':
        if (!cfg.requirementSubject) return false;
        return run.stats.hazardsSurvived.includes(cfg.requirementSubject as HazardId);
      case 'reach_combo':
        return run.stats.bestCombo >= cfg.requirementValue;
      case 'shop_item_purchased':
        if (!cfg.requirementSubject) return false;
        return (run.shopLevels as Record<string, number | undefined>)[
          cfg.requirementSubject
        ] !== undefined && (run.shopLevels as any)[cfg.requirementSubject] >= 1;
      case 'shop_item_max_level':
        if (!cfg.requirementSubject) return false;
        return (
          ((run.shopLevels as any)[cfg.requirementSubject] ?? 0) >= cfg.requirementValue
        );
      case 'shop_purchases_in_run':
        return run.stats.shopItemsPurchased >= cfg.requirementValue;
      case 'tools_owned_in_run':
        return run.stats.toolsOwned >= cfg.requirementValue;
      case 'instant_powerups_in_run':
        return run.stats.instantsUsed >= cfg.requirementValue;
      case 'lose_with_meter_pct_min':
        if (opts.lostMeterPctAtFail === undefined) return false;
        return opts.lostMeterPctAtFail >= cfg.requirementValue;
      case 'pops_during_hazard':
        if (!cfg.requirementSubject) return false;
        return (
          (run.stats.popsDuringHazard[cfg.requirementSubject as HazardId] ?? 0) >=
          cfg.requirementValue
        );
      case 'prestige_count':
        return persist.prestigeCount >= cfg.requirementValue;
      case 'party_multiplier_min':
        return Math.round(save.partyMultiplier * 100) >= cfg.requirementValue;
    }
  }

  getPolishBonusValue(type: BadgeConfig['polishBonus']['type']): number {
    let total = 0;
    const cleaned = this.store.save.data.badgesCleaned;
    for (const id of cleaned) {
      const cfg = BADGES.find((b) => b.id === id);
      if (cfg && cfg.polishBonus.type === type) total += cfg.polishBonus.value;
    }
    return total;
  }

  /** Dev helper: return an unlocked badge to dirty state so it can be cleaned again. */
  resetCleaning(badgeId: string): boolean {
    const save = this.store.save.data;
    if (!save.badgesUnlocked.includes(badgeId)) return false;

    save.badgesCleaned = save.badgesCleaned.filter((id) => id !== badgeId);
    const cfg = BADGES.find((b) => b.id === badgeId);
    save.badgeCleaningState[badgeId] = {
      cleaningRequired: this.rollCleaningRequirement(cfg?.difficulty ?? 'medium'),
      cleaningProgress: 0,
    };
    this.store.updateSave(() => {});
    return true;
  }

  /** Dev helper: unlock every badge (dirty, not cleaned). Returns newly unlocked ids. */
  unlockAll(): string[] {
    const newlyUnlocked: string[] = [];
    const save = this.store.save.data;

    for (const cfg of BADGES) {
      if (save.badgesUnlocked.includes(cfg.id)) continue;
      save.badgesUnlocked.push(cfg.id);
      save.badgeCleaningState[cfg.id] = {
        cleaningRequired: this.rollCleaningRequirement(cfg.difficulty),
        cleaningProgress: 0,
      };
      newlyUnlocked.push(cfg.id);
      this.store.bus.emit('badge:unlock', { id: cfg.id });
    }

    if (newlyUnlocked.length > 0) {
      this.store.updateSave(() => {});
    }
    return newlyUnlocked;
  }
}
