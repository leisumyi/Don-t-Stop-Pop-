import type { GameStore } from '../core/GameStore';
import type { CosmeticSystem } from '../systems/CosmeticSystem';
import { COSMETICS } from '../data/cosmetics';

/**
 * Applies the equipped UI theme + background-color cosmetic to the document.
 */
export class PhoneFrame {
  private frame: HTMLElement;
  private setBg?: (top: string, mid: string, bottom: string) => void;
  private setBalloonPalette?: (palette: { hueShift?: number; saturation?: number; lightness?: number } | null) => void;
  private setPopEffect?: (key: 'confetti' | 'glitter' | 'bubble' | 'star' | 'streamer') => void;

  constructor(
    private store: GameStore,
    private cosmetics: CosmeticSystem,
  ) {
    const frame = document.getElementById('phone-frame');
    if (!frame) throw new Error('#phone-frame not found');
    this.frame = frame;
    this.cosmetics.onChange(() => this.applyAll());
  }

  bindBackgroundSetter(fn: (top: string, mid: string, bottom: string) => void): void {
    this.setBg = fn;
    this.applyAll();
  }

  bindBalloonPaletteSetter(
    fn: (palette: { hueShift?: number; saturation?: number; lightness?: number } | null) => void,
  ): void {
    this.setBalloonPalette = fn;
    this.applyAll();
  }

  bindPopEffectSetter(
    fn: (key: 'confetti' | 'glitter' | 'bubble' | 'star' | 'streamer') => void,
  ): void {
    this.setPopEffect = fn;
    this.applyAll();
  }

  applyAll(): void {
    const eq = this.store.save.data.cosmeticsEquipped;

    // UI theme
    const uiId = eq.uiTheme;
    if (uiId) {
      const uiCfg = COSMETICS.find((c) => c.id === uiId);
      if (uiCfg?.uiThemeKey) this.frame.dataset.uiTheme = uiCfg.uiThemeKey;
    }

    // Background colors
    const bgId = eq.backgroundTheme;
    if (bgId && this.setBg) {
      const bgCfg = COSMETICS.find((c) => c.id === bgId);
      if (bgCfg?.backgroundColors) {
        this.setBg(bgCfg.backgroundColors.top, bgCfg.backgroundColors.mid, bgCfg.backgroundColors.bottom);
      }
    }

    // Balloon palette
    const skinId = eq.balloonSkin;
    if (skinId && this.setBalloonPalette) {
      const skinCfg = COSMETICS.find((c) => c.id === skinId);
      this.setBalloonPalette(skinCfg?.balloonPalette ?? null);
    }

    // Pop effect
    const popId = eq.popEffect;
    if (popId && this.setPopEffect) {
      const popCfg = COSMETICS.find((c) => c.id === popId);
      if (popCfg?.popEffectKey) {
        this.setPopEffect(popCfg.popEffectKey as any);
      }
    }
  }
}
