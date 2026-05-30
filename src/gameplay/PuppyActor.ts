import * as THREE from 'three';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../three/constants';
import puppySpriteUrl from '../../images/puppy_uppies.png';

const PUPPY_WIDTH = 400;
const JUMP_UP_TIME = 0.32;
const JUMP_DOWN_TIME = 0.42;

type PuppyState = 'idle' | 'up' | 'down';

/**
 * Animated actor for the Puppy Uppies idle powerup. A puppy leaps up from below
 * the bottom edge of the screen, fires an "apex" callback at the top of its
 * arc (where the balloons get popped), then falls back down and hides.
 */
export class PuppyActor {
  private group: THREE.Group;
  private mesh: THREE.Mesh | null = null;
  private halfHeight = 90;
  private restY = 0;
  private apexY = 0;

  private state: PuppyState = 'idle';
  private timer = 0;
  private mirror = 1;
  private onApex: (() => void) | null = null;

  private static sprite: HTMLImageElement | null = null;
  private static spritePromise: Promise<void> | null = null;

  constructor(group: THREE.Group) {
    this.group = group;
  }

  /** Loads the puppy sprite once; resolves even on error (procedural fallback). */
  static preloadSprite(): Promise<void> {
    if (PuppyActor.spritePromise) return PuppyActor.spritePromise;
    PuppyActor.spritePromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        PuppyActor.sprite = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = puppySpriteUrl;
    });
    return PuppyActor.spritePromise;
  }

  /** Lazily builds the mesh (called on first jump, after the sprite is loaded). */
  private ensureMesh(): void {
    if (this.mesh) return;
    const { tex, aspect } = PuppyActor.makeTexture();
    const w = PUPPY_WIDTH;
    const h = w * aspect;
    this.halfHeight = h / 2;
    this.restY = -LOGICAL_HEIGHT / 2 - this.halfHeight - 10;
    this.apexY = -LOGICAL_HEIGHT / 2 + 90;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    this.mesh.position.set(0, this.restY, 0);
    this.mesh.visible = false;
    this.group.add(this.mesh);
  }

  private static makeTexture(): { tex: THREE.Texture; aspect: number } {
    if (PuppyActor.sprite) {
      const img = PuppyActor.sprite;
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      const aspect = img.naturalHeight / img.naturalWidth || 1;
      return { tex, aspect };
    }
    // Procedural fallback: a simple brown puppy-ish blob with paws up.
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 160;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#d79a55';
    ctx.beginPath();
    ctx.ellipse(64, 96, 40, 48, 0, 0, Math.PI * 2); // body
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(64, 44, 30, 28, 0, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.fillStyle = '#b5793a';
    ctx.beginPath();
    ctx.ellipse(40, 30, 10, 18, -0.3, 0, Math.PI * 2); // left ear
    ctx.ellipse(88, 30, 10, 18, 0.3, 0, Math.PI * 2); // right ear
    ctx.fill();
    ctx.fillStyle = '#f3d9b0';
    ctx.beginPath();
    ctx.ellipse(44, 18, 8, 10, 0, 0, Math.PI * 2); // raised paws
    ctx.ellipse(84, 18, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(54, 42, 4, 0, Math.PI * 2); // eyes
    ctx.arc(74, 42, 4, 0, Math.PI * 2);
    ctx.arc(64, 52, 5, 0, Math.PI * 2); // nose
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { tex, aspect: c.height / c.width };
  }

  /** Starts a jump toward targetX, firing onApex once at the top. */
  jump(targetX: number, onApex: () => void): void {
    if (this.state !== 'idle') return;
    this.ensureMesh();
    const mesh = this.mesh!;
    const halfW = PUPPY_WIDTH / 2;
    const clampedX = Math.max(
      -LOGICAL_WIDTH / 2 + halfW,
      Math.min(LOGICAL_WIDTH / 2 - halfW, targetX),
    );
    this.mirror = Math.random() < 0.5 ? -1 : 1;
    mesh.position.set(clampedX, this.restY, 0);
    mesh.scale.set(this.mirror, 1, 1);
    mesh.visible = true;
    this.onApex = onApex;
    this.state = 'up';
    this.timer = 0;
  }

  update(dt: number): void {
    if (!this.mesh || this.state === 'idle') return;
    const mesh = this.mesh;
    this.timer += dt;

    if (this.state === 'up') {
      const t = Math.min(this.timer / JUMP_UP_TIME, 1);
      const eased = t * (2 - t); // easeOutQuad
      mesh.position.y = this.restY + (this.apexY - this.restY) * eased;
      // slight vertical stretch on the way up
      mesh.scale.set((1 - 0.08 * (1 - t)) * this.mirror, 1 + 0.12 * (1 - t), 1);
      if (t >= 1) {
        if (this.onApex) this.onApex();
        this.onApex = null;
        this.state = 'down';
        this.timer = 0;
      }
      return;
    }

    // state === 'down'
    const t = Math.min(this.timer / JUMP_DOWN_TIME, 1);
    const eased = t * t; // easeInQuad
    mesh.position.y = this.apexY + (this.restY - this.apexY) * eased;
    mesh.scale.set(this.mirror, 1, 1);
    if (t >= 1) {
      mesh.position.y = this.restY;
      mesh.visible = false;
      this.state = 'idle';
    }
  }

  reset(): void {
    this.state = 'idle';
    this.timer = 0;
    this.onApex = null;
    if (this.mesh) {
      this.mesh.position.y = this.restY;
      this.mesh.visible = false;
    }
  }
}
