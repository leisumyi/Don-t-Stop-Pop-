import type { HazardConfig } from '../core/types';

export const HAZARDS: HazardConfig[] = [
  {
    id: 'windstorm',
    name: 'Windstorm',
    description: 'Balloons drift left and right.',
    duration: 15,
    cooldown: 35,
    unlockPhase: 3,
    color: '#a3c9ff',
  },
  {
    id: 'cloudCover',
    name: 'Cloud Cover',
    description: 'Drifting clouds make balloons harder to see.',
    duration: 15,
    cooldown: 40,
    unlockPhase: 4,
    color: '#dfe7f2',
  },
  {
    id: 'birthdayRush',
    name: 'Birthday Rush',
    description: 'A flurry of extra balloons. Big rewards, big risk.',
    duration: 20,
    cooldown: 45,
    unlockPhase: 4,
    color: '#ffd966',
  },
];
