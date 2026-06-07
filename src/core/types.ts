/**
 * Game-wide TypeScript types shared by core, gameplay, and UI layers.
 * Keep this file dependency-free so it can be imported anywhere.
 */

export type GameStateName =
  | 'BOOT'
  | 'MAIN_MENU'
  | 'TUTORIAL'
  | 'RUNNING'
  | 'PAUSED'
  | 'SHOP_OPEN'
  | 'STAMP_CARD_OPEN'
  | 'PRESTIGE_CONFIRM'
  | 'FAILED';

export type BalloonTypeId = 'normal' | 'fast' | 'golden' | 'tiny' | 'fineRisk' | 'tank';

export interface BalloonConfig {
  id: BalloonTypeId;
  displayName: string;
  reward: number;
  escapeValue: number;
  speedMin: number;
  speedMax: number;
  radius: number;
  color: number;
  highlightColor: number;
  ribbonColor: number;
  weight: number;
  unlockPhase: number;
  /** Taps required to fully pop. Defaults to 1 when omitted. */
  hitsToPop?: number;
}

export type ShopItemId =
  | 'dartThrower'
  | 'puppyUppies'
  | 'cloudBlower'
  | 'cakeFreeze'
  | 'partyNet'
  | 'comboRibbon';

export interface ShopItemConfig {
  id: ShopItemId;
  name: string;
  description: string;
  icon: string;
  kind: 'idle' | 'instant' | 'temporary';
  baseCost: number;
  costScale?: number;
  maxLevel: number;
  effectByLevel?: Record<number, number>;
}

export type HazardId = 'windstorm' | 'cloudCover' | 'birthdayRush';

export interface HazardConfig {
  id: HazardId;
  name: string;
  description: string;
  duration: number;
  cooldown: number;
  unlockPhase: number;
  color: string;
}

export type DifficultyPhaseId = 1 | 2 | 3 | 4 | 5;

export interface DifficultyPhase {
  id: DifficultyPhaseId;
  name: string;
  startTime: number;
  spawnInterval: number;
  spawnVariance: number;
  maxConcurrent: number;
  enabledTypes: BalloonTypeId[];
  enabledHazards: HazardId[];
}

export type BadgeRequirementType =
  | 'total_balloons_popped'
  | 'total_party_bucks_earned'
  | 'balloons_popped_by_type'
  | 'survive_seconds_in_run'
  | 'survive_hazard'
  | 'reach_combo'
  | 'shop_item_purchased'
  | 'shop_item_max_level'
  | 'shop_purchases_in_run'
  | 'tools_owned_in_run'
  | 'instant_powerups_in_run'
  | 'lose_with_meter_pct_min'
  | 'pops_during_hazard'
  | 'prestige_count'
  | 'party_multiplier_min';

export interface BadgePolishBonus {
  type:
    | 'party_bucks_bonus'
    | 'idle_speed_bonus'
    | 'combo_duration_bonus'
    | 'golden_chance_bonus'
    | 'bonus_buck_chance';
  value: number;
}

export type BadgeDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  category: 'Popping' | 'Survival' | 'Upgrade' | 'Skill' | 'Prestige';
  icon: string;
  image: string;
  dirtyImage?: string;
  difficulty: BadgeDifficulty;
  requirementType: BadgeRequirementType;
  requirementValue: number;
  requirementSubject?: string;
  rewardStickerShine: number;
  polishBonus: BadgePolishBonus;
}

export interface BadgeCleaningState {
  cleaningRequired: number;
  cleaningProgress: number;
}

export type CosmeticCategory =
  | 'stampCardTheme'
  | 'backgroundTheme'
  | 'balloonSkin'
  | 'popEffect'
  | 'uiTheme';

export interface CosmeticConfig {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  cost: number;
  swatch: string;
  uiThemeKey?: string;
  stampCardThemeKey?: string;
  backgroundColors?: { top: string; mid: string; bottom: string };
  balloonPalette?: { hueShift?: number; saturation?: number; lightness?: number };
  popEffectKey?: string;
}

export interface PermanentBoostConfig {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect:
    | { type: 'party_bucks_mult'; value: number }
    | { type: 'idle_speed_mult'; value: number }
    | { type: 'starting_meter_safety'; value: number }
    | { type: 'golden_chance_bonus'; value: number }
    | { type: 'combo_duration_mult'; value: number }
    | { type: 'early_difficulty_softening'; value: number }
    | { type: 'free_cloud_blower'; value: number }
    | { type: 'free_cake_freeze'; value: number };
}

export interface RunStats {
  startTime: number;
  elapsed: number;
  popsTotal: number;
  popsByType: Record<BalloonTypeId, number>;
  partyBucksEarned: number;
  shopItemsPurchased: number;
  instantsUsed: number;
  hazardsSurvived: HazardId[];
  popsDuringHazard: Record<HazardId, number>;
  bestCombo: number;
  toolsOwned: number;
}

export interface PersistentStats {
  totalBalloonsPopped: number;
  totalBalloonsByType: Record<BalloonTypeId, number>;
  totalPartyBucksEarned: number;
  prestigeCount: number;
  highestCombo: number;
  longestRunSeconds: number;
  highestPopsInRun: number;
}

export interface SaveData {
  version: number;
  persistent: PersistentStats;
  partyMultiplier: number;
  stickerShine: number;
  badgesUnlocked: string[];
  badgesCleaned: string[];
  badgeCleaningState: Record<string, BadgeCleaningState>;
  cosmeticsOwned: string[];
  cosmeticsEquipped: Partial<Record<CosmeticCategory, string>>;
  permanentBoosts: string[];
  tutorialCompleted: boolean;
  tankIntroCompleted: boolean;
}

export interface FloatingTextRequest {
  x: number;
  y: number;
  text: string;
  golden?: boolean;
}
