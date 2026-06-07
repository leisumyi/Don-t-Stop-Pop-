import type {
  BadgeCleaningState,
  BalloonTypeId,
  CosmeticCategory,
  HazardId,
  PersistentStats,
  SaveData,
} from './types';

const STORAGE_KEY = 'dontStopPop:save';
const CURRENT_VERSION = 2;

export function makeEmptyByType<T>(value: T): Record<BalloonTypeId, T> {
  return {
    normal: value,
    fast: value,
    golden: value,
    tiny: value,
    fineRisk: value,
    tank: value,
  };
}

function makeEmptyHazardCount(): Record<HazardId, number> {
  return { windstorm: 0, cloudCover: 0, birthdayRush: 0 };
}

export function emptyPersistentStats(): PersistentStats {
  return {
    totalBalloonsPopped: 0,
    totalBalloonsByType: makeEmptyByType(0),
    totalPartyBucksEarned: 0,
    prestigeCount: 0,
    highestCombo: 0,
    longestRunSeconds: 0,
    highestPopsInRun: 0,
  };
}

export function emptySaveData(): SaveData {
  return {
    version: CURRENT_VERSION,
    persistent: emptyPersistentStats(),
    partyMultiplier: 0,
    stickerShine: 0,
    badgesUnlocked: [],
    badgesCleaned: [],
    badgeCleaningState: {},
    cosmeticsOwned: [],
    cosmeticsEquipped: {},
    permanentBoosts: [],
    tutorialCompleted: false,
    tankIntroCompleted: false,
  };
}

/**
 * Migrate older save schemas forward. V1 used `badgesPolished: string[]`;
 * V2 replaces that with `badgesCleaned` + per-badge `badgeCleaningState`.
 */
function migrate(raw: unknown): SaveData {
  const empty = emptySaveData();
  if (!raw || typeof raw !== 'object') return empty;
  const data = raw as Record<string, unknown>;

  const persistent: PersistentStats = {
    ...empty.persistent,
    ...((data.persistent as object) ?? {}),
    totalBalloonsByType: {
      ...empty.persistent.totalBalloonsByType,
      ...(data.persistent &&
      typeof data.persistent === 'object' &&
      (data.persistent as Record<string, unknown>).totalBalloonsByType
        ? ((data.persistent as Record<string, unknown>).totalBalloonsByType as object)
        : {}),
    },
  };

  // V1 -> V2: migrate badgesPolished to badgesCleaned
  const legacyPolished = Array.isArray((data as Record<string, unknown>).badgesPolished)
    ? ((data as Record<string, unknown>).badgesPolished as string[])
    : [];
  const badgesCleaned = Array.isArray(data.badgesCleaned)
    ? (data.badgesCleaned as string[])
    : legacyPolished;
  const badgeCleaningState: Record<string, BadgeCleaningState> =
    data.badgeCleaningState && typeof data.badgeCleaningState === 'object'
      ? (data.badgeCleaningState as Record<string, BadgeCleaningState>)
      : {};

  return {
    version: CURRENT_VERSION,
    persistent,
    partyMultiplier: typeof data.partyMultiplier === 'number' ? data.partyMultiplier : 0,
    stickerShine: typeof data.stickerShine === 'number' ? data.stickerShine : 0,
    badgesUnlocked: Array.isArray(data.badgesUnlocked) ? (data.badgesUnlocked as string[]) : [],
    badgesCleaned,
    badgeCleaningState,
    cosmeticsOwned: Array.isArray(data.cosmeticsOwned) ? (data.cosmeticsOwned as string[]) : [],
    cosmeticsEquipped:
      data.cosmeticsEquipped && typeof data.cosmeticsEquipped === 'object'
        ? (data.cosmeticsEquipped as Partial<Record<CosmeticCategory, string>>)
        : {},
    permanentBoosts: Array.isArray(data.permanentBoosts) ? (data.permanentBoosts as string[]) : [],
    tutorialCompleted: !!data.tutorialCompleted,
    tankIntroCompleted: !!data.tankIntroCompleted,
  };
}

export interface SaveBackend {
  read(): string | null;
  write(value: string): void;
  remove(): void;
}

class LocalStorageBackend implements SaveBackend {
  read(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
  write(value: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (err) {
      console.warn('[SaveSystem] localStorage write failed', err);
    }
  }
  remove(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

export class SaveSystem {
  private backend: SaveBackend;
  private cache: SaveData;
  private dirty = false;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly autosaveDebounceMs = 500;
  // Internal counter used by tests to confirm writes.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  writeCount = 0;
  // For test backends that should not auto-flush
  private readonly autoFlush: boolean;

  constructor(backend?: SaveBackend, opts?: { autoFlush?: boolean }) {
    this.backend = backend ?? new LocalStorageBackend();
    this.autoFlush = opts?.autoFlush ?? true;
    this.cache = this.load();
  }

  private load(): SaveData {
    const raw = this.backend.read();
    if (!raw) return emptySaveData();
    try {
      return migrate(JSON.parse(raw));
    } catch (err) {
      console.warn('[SaveSystem] failed to parse save, starting fresh', err);
      return emptySaveData();
    }
  }

  get data(): SaveData {
    return this.cache;
  }

  update(mutator: (d: SaveData) => void): void {
    mutator(this.cache);
    this.dirty = true;
    if (this.autoFlush) this.scheduleFlush();
  }

  set(next: SaveData): void {
    this.cache = next;
    this.dirty = true;
    if (this.autoFlush) this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.flush();
    }, this.autosaveDebounceMs);
  }

  flush(): void {
    if (!this.dirty) return;
    try {
      this.backend.write(JSON.stringify(this.cache));
      this.writeCount++;
      this.dirty = false;
    } catch (err) {
      console.warn('[SaveSystem] flush failed', err);
    }
  }

  reset(): void {
    this.cache = emptySaveData();
    this.dirty = true;
    this.flush();
  }

  hardReset(): void {
    this.backend.remove();
    this.cache = emptySaveData();
    this.dirty = false;
    this.writeCount = 0;
  }

  /** Convenience helper for tests. */
  static memoryBackend(): SaveBackend {
    let value: string | null = null;
    return {
      read: () => value,
      write: (v) => {
        value = v;
      },
      remove: () => {
        value = null;
      },
    };
  }
}

export const SAVE_VERSION = CURRENT_VERSION;
export const HAZARD_ZERO_COUNT = makeEmptyHazardCount;
