import balloonPopUrl from '../../sounds/balloonpop.wav';
import dogBarkUrl from '../../sounds/dogbark.wav';
import bgmUrl from '../../sounds/bgmusic.mp3';

/**
 * WebAudio sound system. Balloon pops and the dog bark play decoded sample
 * buffers (balloonpop.wav / dogbark.wav) with per-event pitch variation; the
 * remaining UI feedback (chimes, fail) stays procedural.
 *
 * Browsers require a user gesture before AudioContext can produce sound, so
 * we lazily resume on the first call and silently no-op until then.
 */
export type SoundId = 'pop' | 'popGold' | 'popTiny' | 'popRisk' | 'popTank' | 'popThud' | 'shop' | 'badge' | 'fail' | 'prestige' | 'bark' | 'squeakyClean' | 'bling';

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private sfxMuted = false;
  private bgmMuted = false;
  private sfxGain: GainNode | null = null;
  private popBuffer: AudioBuffer | null = null;
  private barkBuffer: AudioBuffer | null = null;
  private bgmEl: HTMLAudioElement | null = null;

  constructor() {
    // Restore persisted audio preferences. If only the old master key exists,
    // map it onto both channels for backward compatibility.
    const oldMasterMuted = localStorage.getItem('dontStopPop:muted');
    const storedSfxMuted = localStorage.getItem('dontStopPop:sfxMuted');
    const storedBgmMuted = localStorage.getItem('dontStopPop:bgmMuted');
    this.sfxMuted = storedSfxMuted ? storedSfxMuted === '1' : oldMasterMuted === '1';
    this.bgmMuted = storedBgmMuted ? storedBgmMuted === '1' : oldMasterMuted === '1';

    const resume = () => {
      this.ensureCtx();
      if (this.ctx?.state === 'suspended') this.ctx.resume();
      this.startBgmIfReady();
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('touchstart', resume);
      window.removeEventListener('keydown', resume);
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('touchstart', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
  }

  setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted;
    localStorage.setItem('dontStopPop:sfxMuted', muted ? '1' : '0');
    if (this.sfxGain) this.sfxGain.gain.value = muted ? 0 : 0.45;
  }

  setBgmMuted(muted: boolean): void {
    this.bgmMuted = muted;
    localStorage.setItem('dontStopPop:bgmMuted', muted ? '1' : '0');
    if (this.bgmEl) this.bgmEl.muted = muted;
    if (!muted) this.startBgmIfReady();
  }

  isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  isBgmMuted(): boolean {
    return this.bgmMuted;
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.sfxGain = this.ctx!.createGain();
      this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.45;
      this.sfxGain.connect(this.ctx!.destination);
      return this.ctx;
    } catch {
      return null;
    }
  }

  private ensureBgmElement(): HTMLAudioElement {
    if (this.bgmEl) return this.bgmEl;
    const el = new Audio(bgmUrl);
    el.loop = true;
    el.preload = 'auto';
    // Keep this low enough to sit under gameplay SFX.
    el.volume = 0.2;
    el.muted = this.bgmMuted;
    this.bgmEl = el;
    return el;
  }

  private startBgmIfReady(): void {
    if (this.bgmMuted) return;
    const el = this.ensureBgmElement();
    if (!el.paused) return;
    void el.play().catch(() => {
      // Autoplay can fail before a user gesture; resume listeners retry.
    });
  }

  /**
   * Fetches and decodes the WAV samples into buffers. Resolves even on failure
   * so the game still runs (pop/bark just no-op until/unless decoded).
   */
  async preload(): Promise<void> {
    this.ensureBgmElement();
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const load = async (url: string): Promise<AudioBuffer | null> => {
      try {
        const res = await fetch(url);
        const data = await res.arrayBuffer();
        return await ctx.decodeAudioData(data);
      } catch {
        return null;
      }
    };
    const [pop, bark] = await Promise.all([load(balloonPopUrl), load(dogBarkUrl)]);
    this.popBuffer = pop;
    this.barkBuffer = bark;
    this.startBgmIfReady();
  }

  /** Plays a decoded buffer once at the given playback rate (pitch) and volume. */
  private playBuffer(buffer: AudioBuffer, rate: number, volume: number): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this.sfxGain);
    src.start();
  }

  /** Returns a base pop pitch per balloon type, with a small random jitter. */
  private popRate(id: 'pop' | 'popGold' | 'popTiny' | 'popRisk' | 'popTank' | 'popThud'): number {
    const base =
      id === 'popTiny'
        ? 1.25
        : id === 'popGold'
          ? 0.95
          : id === 'popRisk'
            ? 0.8
            : id === 'popTank'
              ? 0.6
              : id === 'popThud'
                ? 0.5
                : 1.0;
    return base * (0.95 + Math.random() * 0.1);
  }

  private popVolume(id: 'pop' | 'popGold' | 'popTiny' | 'popRisk' | 'popTank' | 'popThud'): number {
    if (id === 'popTank') return 1.6;
    if (id === 'popThud') return 0.7;
    return 1.05;
  }

  play(id: SoundId, pitchMul = 1): void {
    if (this.sfxMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    switch (id) {
      case 'pop':
      case 'popTiny':
      case 'popRisk':
      case 'popTank':
      case 'popThud':
        if (this.popBuffer) {
          this.playBuffer(this.popBuffer, this.popRate(id) * pitchMul, this.popVolume(id));
        }
        break;
      case 'popGold':
        if (this.popBuffer) {
          this.playBuffer(this.popBuffer, this.popRate(id) * pitchMul, this.popVolume(id));
        }
        this.playSparkle(ctx, now + 0.04);
        break;
      case 'shop':
        this.playChime(ctx, now, [660, 880]);
        break;
      case 'badge':
        this.playChime(ctx, now, [660, 880, 1320]);
        break;
      case 'fail':
        this.playPop(ctx, now, 220, 0.18, 0.35);
        this.playPop(ctx, now + 0.18, 160, 0.22, 0.4);
        break;
      case 'prestige':
        this.playChime(ctx, now, [523, 659, 784, 1047]);
        break;
      case 'bark':
        if (this.barkBuffer) this.playBuffer(this.barkBuffer, (0.95 + Math.random() * 0.1) * pitchMul, 0.225);
        break;
      case 'squeakyClean':
        this.playSqueakyClean(ctx, now);
        break;
      case 'bling':
        this.playBling(ctx, now);
        break;
    }
  }

  private playPop(
    ctx: AudioContext,
    when: number,
    freq: number,
    duration: number,
    volume: number,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.55), when + duration);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(volume, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private playSparkle(ctx: AudioContext, when: number): void {
    const freqs = [1200, 1600, 2000];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, when + i * 0.04);
      gain.gain.setValueAtTime(0, when + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.05, when + i * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + i * 0.04 + 0.12);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(when + i * 0.04);
      osc.stop(when + i * 0.04 + 0.14);
    });
  }

  private playChime(ctx: AudioContext, when: number, freqs: number[]): void {
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = when + i * 0.06;
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  }

  /** Short squeaky wipe: quick sine sweep up with random pitch jitter. */
  private playSqueakyClean(ctx: AudioContext, when: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 1400 + Math.random() * 400;
    osc.frequency.setValueAtTime(baseFreq, when);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, when + 0.06);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, when + 0.1);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.08, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(when);
    osc.stop(when + 0.14);
  }

  /** Sparkly completion bling: ascending cascade brighter than the badge chime. */
  private playBling(ctx: AudioContext, when: number): void {
    const freqs = [880, 1320, 1760, 2640];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = when + i * 0.05;
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 0.44);
    });
    // Add a shimmer layer with triangle waves
    [1600, 2200, 3000].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = when + 0.08 + i * 0.04;
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.04, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }
}
