import { describe, expect, it } from 'vitest';
import { GameStore } from '../src/core/GameStore';
import { SaveSystem } from '../src/core/SaveSystem';
import { CosmeticSystem } from '../src/systems/CosmeticSystem';
import { BoostSystem } from '../src/systems/BoostSystem';
import { COSMETICS, DEFAULT_EQUIPPED } from '../src/data/cosmetics';

function makeStore(): GameStore {
  const save = new SaveSystem(SaveSystem.memoryBackend(), { autoFlush: false });
  return new GameStore(save);
}

describe('CosmeticSystem', () => {
  it('auto-owns and equips the default (free) cosmetics', () => {
    const store = makeStore();
    const sys = new CosmeticSystem(store);
    for (const [cat, id] of Object.entries(DEFAULT_EQUIPPED)) {
      expect(sys.isOwned(id)).toBe(true);
      expect(sys.equippedIn(cat as any)).toBe(id);
    }
  });

  it('cannot buy a cosmetic without enough sticker shine', () => {
    const store = makeStore();
    const sys = new CosmeticSystem(store);
    const paid = COSMETICS.find((c) => c.cost > 0)!;
    expect(sys.buy(paid.id)).toBe(false);
    expect(sys.isOwned(paid.id)).toBe(false);
  });

  it('buys a cosmetic and deducts sticker shine', () => {
    const store = makeStore();
    const sys = new CosmeticSystem(store);
    const paid = COSMETICS.find((c) => c.cost > 0)!;
    store.updateSave((s) => {
      s.stickerShine = paid.cost + 5;
    });
    expect(sys.buy(paid.id)).toBe(true);
    expect(sys.isOwned(paid.id)).toBe(true);
    expect(store.save.data.stickerShine).toBe(5);
  });

  it('equips an owned cosmetic in its category slot', () => {
    const store = makeStore();
    const sys = new CosmeticSystem(store);
    const paid = COSMETICS.find((c) => c.cost > 0 && c.category === 'uiTheme')!;
    store.updateSave((s) => {
      s.stickerShine = 999;
    });
    sys.buy(paid.id);
    expect(sys.equip(paid.id)).toBe(true);
    expect(sys.equippedIn('uiTheme')).toBe(paid.id);
  });

  it('cannot equip an unowned cosmetic', () => {
    const store = makeStore();
    const sys = new CosmeticSystem(store);
    const paid = COSMETICS.find((c) => c.cost > 0)!;
    expect(sys.equip(paid.id)).toBe(false);
  });
});

describe('BoostSystem', () => {
  it('buys a permanent boost and the store reflects its effect', () => {
    const store = makeStore();
    const boosts = new BoostSystem(store);
    store.updateSave((s) => {
      s.stickerShine = 999;
    });
    expect(boosts.buy('boost_bucks_5')).toBe(true);
    expect(store.permanentBoostValue('party_bucks_mult')).toBeCloseTo(0.05);
  });

  it('stacks two party-bucks boosts additively', () => {
    const store = makeStore();
    const boosts = new BoostSystem(store);
    store.updateSave((s) => {
      s.stickerShine = 999;
    });
    boosts.buy('boost_bucks_5');
    boosts.buy('boost_bucks_5_b');
    expect(store.permanentBoostValue('party_bucks_mult')).toBeCloseTo(0.1);
  });

  it('cannot buy the same boost twice', () => {
    const store = makeStore();
    const boosts = new BoostSystem(store);
    store.updateSave((s) => {
      s.stickerShine = 999;
    });
    expect(boosts.buy('boost_idle_5')).toBe(true);
    expect(boosts.buy('boost_idle_5')).toBe(false);
  });

  it('applies starting meter safety to a fresh run', () => {
    const store = makeStore();
    const boosts = new BoostSystem(store);
    store.updateSave((s) => {
      s.stickerShine = 999;
    });
    boosts.buy('boost_meter_safety'); // +1
    store.resetRun();
    expect(store.run.escapeMeterMax).toBe(21);
  });
});
