import type { ShopItemConfig } from '../core/types';

export const SHOP_ITEMS: ShopItemConfig[] = [
  {
    id: 'dartThrower',
    name: 'Dart Thrower',
    description: 'Auto-pops a balloon every few seconds. Upgrade to fire faster.',
    icon: '>',
    kind: 'idle',
    baseCost: 25,
    costScale: 1.68,
    maxLevel: 5,
    effectByLevel: { 1: 5.0, 2: 4.0, 3: 3.0, 4: 2.25, 5: 1.5 },
  },
  {
    id: 'puppyUppies',
    name: 'Puppy Uppies',
    description: 'A puppy leaps up from the bottom, popping the lowest balloons. Upgrade to pop more at once.',
    icon: 'D',
    kind: 'idle',
    baseCost: 75,
    costScale: 1.7,
    maxLevel: 5,
    effectByLevel: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
  },
  {
    id: 'cloudBlower',
    name: 'Cloud Blower',
    description: 'Clears Cloud Cover for 8s and prevents new clouds for 5s.',
    icon: '~',
    kind: 'instant',
    baseCost: 130,
    maxLevel: 99,
  },
  {
    id: 'cakeFreeze',
    name: 'Cake Freeze',
    description: 'Slows all balloons by 50% for 5 seconds.',
    icon: '*',
    kind: 'instant',
    baseCost: 160,
    maxLevel: 99,
  },
  {
    id: 'partyNet',
    name: 'Party Net',
    description: 'Reduces the Balloon Escape Meter by 5.',
    icon: '#',
    kind: 'instant',
    baseCost: 200,
    maxLevel: 99,
  },
  {
    id: 'comboRibbon',
    name: 'Combo Ribbon',
    description: 'Combo timer +30% for 20 seconds.',
    icon: '^',
    kind: 'temporary',
    baseCost: 110,
    maxLevel: 99,
  },
];

export function shopCost(itemId: string, currentLevel: number): number {
  const cfg = SHOP_ITEMS.find((s) => s.id === itemId);
  if (!cfg) return Infinity;
  const scale = cfg.costScale ?? 1;
  return Math.round(cfg.baseCost * Math.pow(scale, currentLevel));
}
