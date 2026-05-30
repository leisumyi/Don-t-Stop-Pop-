import * as THREE from 'three';
import type { DifficultyPhase, HazardId } from '../core/types';
import { HAZARDS } from '../data/hazards';
import type { GameStore } from '../core/GameStore';
import type { BalloonManager } from './BalloonManager';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../three/constants';
import { randomCloudTexture } from '../three/cloudTextures';

interface ActiveHazard {
  id: HazardId;
  remaining: number;
  duration: number;
}

interface CloudPiece {
  mesh: THREE.Mesh;
  vx: number;
  alphaTarget: number;
  alphaCurrent: number;
  toRemove?: boolean;
}

/**
 * Drives Windstorm, Cloud Cover, and Birthday Rush events. Hazard cadence
 * begins when the current difficulty phase enables that hazard.
 */
export class HazardManager {
  private active: Map<HazardId, ActiveHazard> = new Map();
  private cooldown: Map<HazardId, number> = new Map();
  private clouds: CloudPiece[] = [];
  private cloudGroup: THREE.Group;
  private cloudBlowerActive = false;
  private cloudBlowerBlocking = false;
  private windDirection: -1 | 1 = 1;

  constructor(
    private store: GameStore,
    private balloons: BalloonManager,
    cloudCoverGroup: THREE.Group,
  ) {
    this.cloudGroup = cloudCoverGroup;
    HAZARDS.forEach((h) => this.cooldown.set(h.id, h.cooldown * 0.6));
  }

  isActive(id: HazardId): boolean {
    return this.active.has(id);
  }

  /** Triggered by the Cloud Blower shop item. */
  triggerCloudBlower(durationClear: number, durationBlock: number): void {
    this.cloudBlowerActive = true;
    this.cloudBlowerBlocking = true;
    // Force-end an active cloud cover hazard
    if (this.active.has('cloudCover')) {
      this.endHazard('cloudCover');
    }
    // mark the existing clouds for removal
    for (const c of this.clouds) c.alphaTarget = 0;
    this.store.run.activeBoosts.cloudBlowerTimer = durationClear;
    this.store.run.activeBoosts.cloudBlockTimer = durationBlock;
  }

  /** Triggered by the Cake Freeze shop item. */
  triggerCakeFreeze(duration: number): void {
    this.store.run.activeBoosts.speedFactor = 0.5;
    this.store.run.activeBoosts.speedTimer = duration;
    this.balloons.setGlobalSpeedFactor(0.5);
  }

  triggerComboRibbon(duration: number, factor: number): void {
    this.store.run.activeBoosts.comboDurationFactor = factor;
    this.store.run.activeBoosts.comboDurationTimer = duration;
  }

  /** Force-start a hazard (manual trigger, e.g. tutorial). */
  forceStart(id: HazardId): void {
    if (this.active.has(id)) return;
    if (id === 'cloudCover' && this.cloudBlowerBlocking) return;
    const cfg = HAZARDS.find((h) => h.id === id);
    if (!cfg) return;
    this.startHazard(cfg.id, cfg.duration);
  }

  update(dt: number, phase: DifficultyPhase): void {
    // -------- update active hazards --------
    for (const [id, h] of this.active) {
      h.remaining -= dt;
      if (id === 'cloudCover') this.updateClouds(dt, true);
      if (h.remaining <= 0) {
        this.endHazard(id);
      }
    }
    // -------- update cooldowns --------
    for (const [id, t] of this.cooldown) {
      this.cooldown.set(id, Math.max(0, t - dt));
    }

    // -------- maybe start a new hazard --------
    for (const cfg of HAZARDS) {
      if (this.active.has(cfg.id)) continue;
      if (!phase.enabledHazards.includes(cfg.id)) continue;
      if ((this.cooldown.get(cfg.id) ?? 0) > 0) continue;
      // Single random check — small chance per second once cooldown elapses,
      // so we don't always trigger immediately.
      const triggerChance = 0.55 * dt;
      if (Math.random() < triggerChance) {
        if (cfg.id === 'cloudCover' && this.cloudBlowerBlocking) continue;
        this.startHazard(cfg.id, cfg.duration);
        break;
      }
    }

    // -------- cloud blower timers --------
    if (this.store.run.activeBoosts.cloudBlowerTimer > 0) {
      this.store.run.activeBoosts.cloudBlowerTimer = Math.max(
        0,
        this.store.run.activeBoosts.cloudBlowerTimer - dt,
      );
      if (this.store.run.activeBoosts.cloudBlowerTimer === 0) {
        this.cloudBlowerActive = false;
      }
    }
    if (this.store.run.activeBoosts.cloudBlockTimer > 0) {
      this.store.run.activeBoosts.cloudBlockTimer = Math.max(
        0,
        this.store.run.activeBoosts.cloudBlockTimer - dt,
      );
      if (this.store.run.activeBoosts.cloudBlockTimer === 0) {
        this.cloudBlowerBlocking = false;
      }
    }

    // -------- speed factor (cake freeze) tick --------
    if (this.store.run.activeBoosts.speedTimer > 0) {
      this.store.run.activeBoosts.speedTimer = Math.max(
        0,
        this.store.run.activeBoosts.speedTimer - dt,
      );
      if (this.store.run.activeBoosts.speedTimer === 0) {
        this.store.run.activeBoosts.speedFactor = 1;
        this.balloons.setGlobalSpeedFactor(1);
      }
    }

    // -------- always tick clouds (for fading out remnants) --------
    if (!this.active.has('cloudCover')) this.updateClouds(dt, false);
  }

  private startHazard(id: HazardId, duration: number): void {
    this.active.set(id, { id, remaining: duration, duration });
    this.store.run.hazardsExperienced.add(id);
    this.store.run.activeHazards[id] = duration;
    this.store.bus.emit('hazard:start', { id, duration });
    if (id === 'windstorm') {
      this.windDirection = Math.random() < 0.5 ? -1 : 1;
      this.balloons.setWind(this.windDirection, 0.6 + Math.random() * 0.4);
    } else if (id === 'birthdayRush') {
      this.balloons.setRushSpawnMultiplier(1.75);
    } else if (id === 'cloudCover') {
      // spawn clouds across the play area
      this.spawnInitialClouds();
    }
  }

  private endHazard(id: HazardId): void {
    this.active.delete(id);
    delete this.store.run.activeHazards[id];
    const cfg = HAZARDS.find((h) => h.id === id);
    if (cfg) this.cooldown.set(id, cfg.cooldown);
    this.store.bus.emit('hazard:end', { id });
    if (id === 'windstorm') {
      this.balloons.setWind(0, 0);
    } else if (id === 'birthdayRush') {
      this.balloons.setRushSpawnMultiplier(1);
    } else if (id === 'cloudCover') {
      // mark clouds to fade out
      for (const c of this.clouds) c.alphaTarget = 0;
    }
  }

  private spawnInitialClouds(): void {
    if (this.cloudBlowerActive) return;
    for (let i = 0; i < 4; i++) {
      this.spawnCloud();
    }
  }

  private spawnCloud(): void {
    const cloud = randomCloudTexture();
    const tex = cloud?.texture ?? HazardManager.getCloudTexture();
    const aspect = cloud?.aspect ?? 1 / 0.55;
    const w = 280 + Math.random() * 140;
    const h = w / aspect;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 }),
    );
    const xStart = -LOGICAL_WIDTH / 2 - w / 2 + Math.random() * 60;
    const y = -LOGICAL_HEIGHT / 4 + Math.random() * (LOGICAL_HEIGHT / 1.4);
    mesh.position.set(xStart, y, 0);
    this.cloudGroup.add(mesh);
    this.clouds.push({
      mesh,
      vx: 30 + Math.random() * 25,
      alphaTarget: 0.78,
      alphaCurrent: 0,
    });
  }

  private updateClouds(dt: number, hazardOn: boolean): void {
    if (hazardOn && !this.cloudBlowerActive && this.clouds.length < 6 && Math.random() < dt * 0.8) {
      this.spawnCloud();
    }
    for (const c of this.clouds) {
      c.mesh.position.x += c.vx * dt;
      const target = this.cloudBlowerActive ? 0 : c.alphaTarget;
      c.alphaCurrent += (target - c.alphaCurrent) * Math.min(1, dt * 1.5);
      (c.mesh.material as THREE.MeshBasicMaterial).opacity = c.alphaCurrent;
      if (c.mesh.position.x > LOGICAL_WIDTH / 2 + 220) {
        c.toRemove = true;
      } else if (c.alphaCurrent < 0.02 && target === 0) {
        c.toRemove = true;
      }
    }
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      if (c.toRemove) {
        this.cloudGroup.remove(c.mesh);
        c.mesh.geometry.dispose();
        (c.mesh.material as THREE.Material).dispose();
        this.clouds.splice(i, 1);
      }
    }
  }

  reset(): void {
    for (const id of Array.from(this.active.keys())) {
      this.endHazard(id);
    }
    this.active.clear();
    HAZARDS.forEach((h) => this.cooldown.set(h.id, h.cooldown * 0.6));
    this.cloudBlowerActive = false;
    this.cloudBlowerBlocking = false;
    for (const c of this.clouds) {
      this.cloudGroup.remove(c.mesh);
      c.mesh.geometry.dispose();
      (c.mesh.material as THREE.Material).dispose();
    }
    this.clouds.length = 0;
    this.balloons.setWind(0, 0);
    this.balloons.setGlobalSpeedFactor(1);
    this.balloons.setRushSpawnMultiplier(1);
  }

  // ------- shared cloud texture -------
  private static cloudTex: THREE.CanvasTexture | null = null;
  private static getCloudTexture(): THREE.CanvasTexture {
    if (this.cloudTex) return this.cloudTex;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 144;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(245,245,250,0.95)';
    const blobs = [
      { x: 80, y: 78, r: 50 },
      { x: 130, y: 60, r: 58 },
      { x: 180, y: 76, r: 48 },
      { x: 110, y: 98, r: 40 },
      { x: 165, y: 100, r: 38 },
    ];
    for (const b of blobs) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    const grad = ctx.createRadialGradient(128, 70, 30, 128, 70, 110);
    grad.addColorStop(0, 'rgba(255,255,255,0.16)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    this.cloudTex = new THREE.CanvasTexture(c);
    this.cloudTex.colorSpace = THREE.SRGBColorSpace;
    return this.cloudTex;
  }
}
