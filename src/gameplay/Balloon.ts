import * as THREE from 'three';
import type { BalloonConfig, BalloonTypeId } from '../core/types';
import { BALLOONS } from '../data/balloons';
import balloonSpriteUrl from '../../images/B_redballoon.png';

/**
 * Per-type recolor of the red source sprite. The source body is ~hue 0 (red),
 * so dH is effectively the target hue. Hue-only: sMul/lAdd are neutral so the
 * exact image (gloss, highlights, shadows, saturation) is preserved and only
 * the color wheel position changes per type.
 */
/** Global render size multiplier (2 = balloons enlarged by 100%). */
const SIZE_SCALE = 2;
/** Horizontal stretch on top of SIZE_SCALE to make balloons wider. */
const WIDTH_STRETCH = 1.3;

const SPRITE_TINTS: Record<BalloonTypeId, { dH: number; sMul: number; lAdd: number }> = {
  normal: { dH: -20 / 360, sMul: 1, lAdd: 0 },
  fast: { dH: 20 / 360, sMul: 1, lAdd: 0 },
  golden: { dH: 45 / 360, sMul: 1, lAdd: 0 },
  tiny: { dH: 150 / 360, sMul: 1, lAdd: 0 },
  fineRisk: { dH: 255 / 360, sMul: 1, lAdd: 0 },
  tank: { dH: 0, sMul: 1.15, lAdd: 0.05 },
};

/**
 * Single balloon instance. Keeps a balloon-shaped Mesh (canvas-textured plane)
 * and exposes update/pop helpers.
 */
export class Balloon {
  readonly mesh: THREE.Mesh;
  readonly type: BalloonTypeId;
  readonly config: BalloonConfig;
  readonly id: number;

  // World position + velocity (units = pixels, +y is up)
  position = new THREE.Vector2();
  velocity = new THREE.Vector2();
  speed = 0;
  baseY = 0;

  // Rendered half-extents (used for hit testing + off-screen margins).
  halfWidth = 0;
  halfHeight = 0;

  // visual state
  age = 0;
  squashTimer = 0;
  shakeTimer = 0;
  popped = false;
  toRemove = false;
  justFullyPopped = false;

  /** Remaining taps before the balloon fully pops. */
  hp: number;
  readonly maxHp: number;

  // wind drift state
  swayPhase = Math.random() * Math.PI * 2;
  swaySpeed = 1.5 + Math.random() * 0.8;

  private static nextId = 1;
  private static textureCache = new Map<string, THREE.CanvasTexture>();
  private static sprite: HTMLImageElement | null = null;
  private static spritePromise: Promise<void> | null = null;

  /**
   * Loads the shared balloon sprite once. Resolves even on error so the game
   * falls back to the procedural rendering instead of hanging on boot.
   */
  static preloadSprite(): Promise<void> {
    if (Balloon.spritePromise) return Balloon.spritePromise;
    Balloon.spritePromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        Balloon.sprite = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = balloonSpriteUrl;
    });
    return Balloon.spritePromise;
  }

  constructor(type: BalloonTypeId, palette: BalloonPaletteOverride | null = null) {
    this.id = Balloon.nextId++;
    this.type = type;
    this.config = BALLOONS[type];
    this.maxHp = this.config.hitsToPop ?? 1;
    this.hp = this.maxHp;
    const tex = Balloon.getTexture(type, palette);
    const aspect = 1.25;
    const base = this.config.radius * 2 * SIZE_SCALE;
    const w = base * WIDTH_STRETCH;
    const h = base * aspect;
    this.halfWidth = w / 2;
    this.halfHeight = h / 2;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    this.mesh.position.z = 0;
  }

  static clearTextureCache(): void {
    for (const tex of Balloon.textureCache.values()) tex.dispose();
    Balloon.textureCache.clear();
  }

  private static getTexture(
    type: BalloonTypeId,
    palette: BalloonPaletteOverride | null,
  ): THREE.CanvasTexture {
    const key = `${type}|${palette ? JSON.stringify(palette) : 'default'}`;
    const cached = Balloon.textureCache.get(key);
    if (cached) return cached;
    const tex = Balloon.makeTexture(type, palette);
    Balloon.textureCache.set(key, tex);
    return tex;
  }

  private static makeTexture(
    type: BalloonTypeId,
    palette: BalloonPaletteOverride | null,
  ): THREE.CanvasTexture {
    if (Balloon.sprite) return Balloon.makeSpriteTexture(type, palette);
    return Balloon.makeProceduralTexture(type, palette);
  }

  /** Recolors the shared sprite per type (+ optional cosmetic palette). */
  private static makeSpriteTexture(
    type: BalloonTypeId,
    palette: BalloonPaletteOverride | null,
  ): THREE.CanvasTexture {
    const sprite = Balloon.sprite!;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 320;
    const ctx = c.getContext('2d')!;

    // Source sprite is square; canvas aspect (0.8) matches the mesh plane, so a
    // full stretch keeps the balloon proportional to how it renders in-world.
    ctx.drawImage(sprite, 0, 0, c.width, c.height);

    const tint = SPRITE_TINTS[type];
    const hueShift = palette?.hueShift ?? 0;
    const satAdd = palette?.saturation ?? 0;
    const lightAdd = palette?.lightness ?? 0;

    const img = ctx.getImageData(0, 0, c.width, c.height);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 10) continue;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const [h, s, l] = rgbToHsl(r, g, b);
      let nh: number;
      let ns: number;
      let nl: number;
      if (type === 'tank') {
        const py = Math.floor(i / 4 / c.width);
        nh = py / c.height + tint.dH + hueShift;
        nh -= Math.floor(nh);
        ns = clamp01(Math.min(1, s * tint.sMul + satAdd + 0.15));
        nl = clamp01(l + tint.lAdd + lightAdd);
      } else {
        nh = h + tint.dH + hueShift;
        nh -= Math.floor(nh);
        ns = clamp01(s * tint.sMul + satAdd);
        nl = clamp01(l + tint.lAdd + lightAdd);
      }
      const [nr, ng, nb] = hslToRgb(nh, ns, nl);
      data[i] = Math.round(nr * 255);
      data[i + 1] = Math.round(ng * 255);
      data[i + 2] = Math.round(nb * 255);
    }
    ctx.putImageData(img, 0, 0);

    return Balloon.finalizeTexture(c);
  }

  private static makeProceduralTexture(
    type: BalloonTypeId,
    palette: BalloonPaletteOverride | null,
  ): THREE.CanvasTexture {
    const cfg = BALLOONS[type];
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 320;
    const ctx = c.getContext('2d')!;

    const baseColor = applyPalette(cfg.color, palette);
    const highlightColor = applyPalette(cfg.highlightColor, palette);

    // body
    const cx = c.width / 2;
    const cy = c.height * 0.42;
    const rx = c.width * 0.4;
    const ry = c.height * 0.35;

    if (type === 'tank') {
      const grad = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
      grad.addColorStop(0, '#ff6b9d');
      grad.addColorStop(0.2, '#ffd166');
      grad.addColorStop(0.4, '#06d6a0');
      grad.addColorStop(0.6, '#118ab2');
      grad.addColorStop(0.8, '#9b5de5');
      grad.addColorStop(1, '#ff6b9d');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, rx * 0.1, cx, cy, rx);
      grad.addColorStop(0, hexToRgba(highlightColor, 1));
      grad.addColorStop(1, hexToRgba(baseColor, 1));
      ctx.fillStyle = grad;
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // bottom knot triangle
    ctx.fillStyle = hexToRgba(darken(baseColor, 0.18), 1);
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + ry - 1);
    ctx.lineTo(cx + 8, cy + ry - 1);
    ctx.lineTo(cx, cy + ry + 12);
    ctx.closePath();
    ctx.fill();

    // ribbon
    ctx.strokeStyle = hexToRgba(applyPalette(cfg.ribbonColor, palette), 0.85);
    ctx.lineWidth = 3;
    ctx.beginPath();
    const start = cy + ry + 12;
    ctx.moveTo(cx, start);
    for (let y = start; y < c.height - 4; y += 6) {
      ctx.lineTo(cx + Math.sin(y * 0.18) * 8, y);
    }
    ctx.stroke();

    // small specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.35, cy - ry * 0.45, rx * 0.18, ry * 0.1, -0.4, 0, Math.PI * 2);
    ctx.fill();

    return Balloon.finalizeTexture(c);
  }

  private static finalizeTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  setStartPosition(x: number, y: number): void {
    this.position.set(x, y);
    this.baseY = y;
    this.mesh.position.set(x, y, 0);
  }

  setVelocity(vx: number, vy: number): void {
    this.velocity.set(vx, vy);
    this.speed = Math.hypot(vx, vy);
  }

  hitTest(wx: number, wy: number): boolean {
    if (this.popped) return false;
    const dx = (wx - this.position.x) / this.halfWidth;
    const dy = (wy - this.position.y) / this.halfHeight;
    return dx * dx + dy * dy <= 1.15;
  }

  update(
    dt: number,
    speedFactor: number,
    windStrength: number,
  ): void {
    this.age += dt;
    if (this.popped) {
      // shrink + fade out animation
      this.squashTimer += dt;
      const t = Math.min(this.squashTimer / 0.18, 1);
      const s = 1 + t * 0.6;
      this.mesh.scale.set(s * (1 - t * 0.4), s * (1 - t * 0.4), 1);
      const mat = this.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - t;
      if (t >= 1) this.toRemove = true;
      return;
    }

    // squash recovery + damage shrink
    const damageScale = this.maxHp > 1 ? 0.85 + 0.15 * (this.hp / this.maxHp) : 1;
    if (this.squashTimer > 0) {
      this.squashTimer = Math.max(0, this.squashTimer - dt);
      const t = this.squashTimer / 0.15;
      this.mesh.scale.set(
        damageScale * (1 - 0.15 * t),
        damageScale * (1 + 0.18 * t),
        1,
      );
    } else {
      this.mesh.scale.set(damageScale, damageScale, 1);
    }

    // base motion
    this.position.y += this.velocity.y * speedFactor * dt;
    this.position.x += this.velocity.x * speedFactor * dt;

    // gentle natural sway
    this.swayPhase += dt * this.swaySpeed;
    const sway = Math.sin(this.swayPhase) * 4;

    // brief shake on partial hits
    let shakeX = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      shakeX = Math.sin(this.shakeTimer * 80) * 6 * (this.shakeTimer / 0.12);
    }

    // wind drift if active (stacked on top of natural sway)
    if (windStrength !== 0) {
      this.position.x += windStrength * 60 * dt;
    }

    this.mesh.position.set(this.position.x + sway + shakeX, this.position.y, 0);
    this.mesh.rotation.z = Math.sin(this.swayPhase * 0.5) * 0.06;
  }

  pop(): void {
    if (this.popped) return;
    this.popped = true;
    this.squashTimer = 0;
  }

  /**
   * Apply one tap/hit. Returns true when the balloon is fully popped.
   * Partial hits squash, shrink, and shake without popping.
   */
  hit(): boolean {
    if (this.popped) return false;
    this.justFullyPopped = false;
    this.hp -= 1;
    if (this.hp <= 0) {
      this.justFullyPopped = true;
      this.pop();
      return true;
    }
    this.squash();
    this.shakeTimer = 0.12;
    return false;
  }

  squash(): void {
    this.squashTimer = 0.15;
  }

  dispose(): void {
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.geometry.dispose();
  }
}

export interface BalloonPaletteOverride {
  hueShift?: number;
  saturation?: number;
  lightness?: number;
}

function applyPalette(hex: number, palette: BalloonPaletteOverride | null): number {
  if (!palette) return hex;
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  const [h, s, l] = rgbToHsl(r, g, b);
  let nh = h + (palette.hueShift ?? 0);
  if (nh < 0) nh += 1;
  if (nh > 1) nh -= 1;
  const ns = Math.min(1, Math.max(0, s + (palette.saturation ?? 0)));
  const nl = Math.min(1, Math.max(0, l + (palette.lightness ?? 0)));
  const [nr, ng, nb] = hslToRgb(nh, ns, nl);
  return ((nr * 255) << 16) | ((ng * 255) << 8) | (nb * 255);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h;
  const tr = (t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [tr(hk + 1 / 3), tr(hk), tr(hk - 1 / 3)];
}

function darken(hex: number, amount: number): number {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  const f = 1 - amount;
  return ((r * f * 255) << 16) | ((g * f * 255) << 8) | (b * f * 255);
}

function hexToRgba(hex: number, alpha: number): string {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}
