import type { PermanentBoostConfig } from '../core/types';

/**
 * 10 permanent boosts (Section 20). Bought with Sticker Shine. Effects stack
 * additively where applicable.
 */
export const PERMANENT_BOOSTS: PermanentBoostConfig[] = [
  {
    id: 'boost_bucks_5',
    name: 'Birthday Wallet',
    description: '+5% Party Bucks earned.',
    cost: 30,
    effect: { type: 'party_bucks_mult', value: 0.05 },
  },
  {
    id: 'boost_bucks_5_b',
    name: 'Bigger Wallet',
    description: 'Another +5% Party Bucks earned.',
    cost: 60,
    effect: { type: 'party_bucks_mult', value: 0.05 },
  },
  {
    id: 'boost_idle_5',
    name: 'Quick Hands',
    description: '+5% idle pop speed.',
    cost: 30,
    effect: { type: 'idle_speed_mult', value: 0.05 },
  },
  {
    id: 'boost_meter_safety',
    name: 'Sturdy Net',
    description: '+1 starting Balloon Escape Meter safety.',
    cost: 40,
    effect: { type: 'starting_meter_safety', value: 1 },
  },
  {
    id: 'boost_meter_safety_b',
    name: 'Sturdier Net',
    description: '+2 starting Balloon Escape Meter safety.',
    cost: 80,
    effect: { type: 'starting_meter_safety', value: 2 },
  },
  {
    id: 'boost_golden_5',
    name: 'Glittering Lure',
    description: '+5% golden balloon spawn chance.',
    cost: 50,
    effect: { type: 'golden_chance_bonus', value: 0.05 },
  },
  {
    id: 'boost_combo_5',
    name: 'Crowd Energy',
    description: '+5% combo duration.',
    cost: 35,
    effect: { type: 'combo_duration_mult', value: 0.05 },
  },
  {
    id: 'boost_difficulty_softening',
    name: 'Easy Warm-up',
    description: '5% slower first-minute difficulty scaling.',
    cost: 28,
    effect: { type: 'early_difficulty_softening', value: 0.05 },
  },
  {
    id: 'boost_free_cloud',
    name: 'Free Cloud Blower',
    description: '+1 free Cloud Blower per run.',
    cost: 45,
    effect: { type: 'free_cloud_blower', value: 1 },
  },
  {
    id: 'boost_free_freeze',
    name: 'Free Cake Freeze',
    description: '+1 free Cake Freeze per run.',
    cost: 45,
    effect: { type: 'free_cake_freeze', value: 1 },
  },
];

export function permanentBoostEffectTotal(
  ownedIds: readonly string[],
  effectType: string,
): number {
  let total = 0;
  for (const id of ownedIds) {
    const cfg = PERMANENT_BOOSTS.find((b) => b.id === id);
    if (cfg && cfg.effect.type === effectType) total += cfg.effect.value;
  }
  return total;
}
