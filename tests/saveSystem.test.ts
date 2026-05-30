import { beforeEach, describe, expect, it } from 'vitest';
import { SaveSystem, emptySaveData } from '../src/core/SaveSystem';

describe('SaveSystem', () => {
  let backend: ReturnType<typeof SaveSystem.memoryBackend>;
  beforeEach(() => {
    backend = SaveSystem.memoryBackend();
  });

  it('returns empty data on first read', () => {
    const sys = new SaveSystem(backend, { autoFlush: false });
    expect(sys.data).toEqual(emptySaveData());
  });

  it('persists updates after flush()', () => {
    const sys = new SaveSystem(backend, { autoFlush: false });
    sys.update((s) => {
      s.stickerShine = 7;
      s.persistent.totalBalloonsPopped = 42;
    });
    sys.flush();
    const sys2 = new SaveSystem(backend, { autoFlush: false });
    expect(sys2.data.stickerShine).toBe(7);
    expect(sys2.data.persistent.totalBalloonsPopped).toBe(42);
  });

  it('migrates partial data without throwing', () => {
    backend.write(JSON.stringify({ version: 0, stickerShine: 3 }));
    const sys = new SaveSystem(backend, { autoFlush: false });
    expect(sys.data.stickerShine).toBe(3);
    expect(sys.data.cosmeticsOwned).toEqual([]);
    expect(sys.data.persistent.totalBalloonsPopped).toBe(0);
  });

  it('hardReset clears storage', () => {
    const sys = new SaveSystem(backend, { autoFlush: false });
    sys.update((s) => {
      s.stickerShine = 12;
    });
    sys.flush();
    sys.hardReset();
    expect(sys.data.stickerShine).toBe(0);
    expect(backend.read()).toBeNull();
  });
});
