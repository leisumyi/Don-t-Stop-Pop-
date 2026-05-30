import * as THREE from 'three';

const PARTICLE_TEX_SIZE = 32;

interface Particle {
  age: number;
  life: number;
  vx: number;
  vy: number;
  rotSpeed: number;
  base: THREE.Mesh;
  scale: number;
}

/**
 * Lightweight CPU particle system that draws confetti / glitter / star bursts
 * on top of the playfield. Each pop spawns a small set of particles which the
 * system ticks and recycles.
 */
export class ParticleSystem {
  private group: THREE.Group;
  private particles: Particle[] = [];
  private static texCache: Record<string, THREE.CanvasTexture> = {};
  private effectKey: 'confetti' | 'glitter' | 'bubble' | 'star' | 'streamer' = 'confetti';

  constructor(group: THREE.Group) {
    this.group = group;
  }

  setEffect(key: 'confetti' | 'glitter' | 'bubble' | 'star' | 'streamer'): void {
    this.effectKey = key;
  }

  spawnBurst(x: number, y: number, intensity = 1, accent?: number): void {
    const count = Math.round(8 * intensity);
    const tex = ParticleSystem.getTexture(this.effectKey);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 1,
        color: accent ?? this.pickAccent(),
      });
      const size = 12 + Math.random() * 14;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
      mesh.position.set(x, y, 0);
      mesh.rotation.z = Math.random() * Math.PI * 2;
      this.group.add(mesh);
      this.particles.push({
        age: 0,
        life: 0.7 + Math.random() * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 60, // add slight upward bias
        rotSpeed: (Math.random() - 0.5) * 6,
        base: mesh,
        scale: 1,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) {
        this.group.remove(p.base);
        (p.base.material as THREE.Material).dispose();
        p.base.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      // simple gravity
      p.vy -= 280 * dt;
      p.base.position.x += p.vx * dt;
      p.base.position.y += p.vy * dt;
      p.base.rotation.z += p.rotSpeed * dt;
      const mat = p.base.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - t;
    }
  }

  private pickAccent(): number {
    const palette = [0xff8fb1, 0xffd966, 0xa3e4c8, 0xc8b6ff, 0xff9e7d, 0xffffff];
    return palette[(Math.random() * palette.length) | 0];
  }

  private static getTexture(key: string): THREE.CanvasTexture {
    if (this.texCache[key]) return this.texCache[key];
    const c = document.createElement('canvas');
    c.width = PARTICLE_TEX_SIZE;
    c.height = PARTICLE_TEX_SIZE;
    const ctx = c.getContext('2d')!;
    const cx = c.width / 2;
    const cy = c.height / 2;
    if (key === 'confetti') {
      ctx.fillStyle = 'white';
      ctx.fillRect(c.width * 0.25, c.height * 0.1, c.width * 0.5, c.height * 0.8);
    } else if (key === 'glitter') {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, c.width, c.height);
    } else if (key === 'bubble') {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(cx - cx * 0.3, cy - cy * 0.3, cx * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (key === 'star') {
      ctx.fillStyle = 'white';
      drawStar(ctx, cx, cy, 5, cx - 4, (cx - 4) / 2);
    } else if (key === 'streamer') {
      ctx.fillStyle = 'white';
      ctx.fillRect(c.width * 0.4, c.height * 0.05, c.width * 0.2, c.height * 0.9);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.texCache[key] = tex;
    return tex;
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outer: number,
  inner: number,
): void {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outer;
    y = cy + Math.sin(rot) * outer;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * inner;
    y = cy + Math.sin(rot) * inner;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outer);
  ctx.closePath();
  ctx.fill();
}
