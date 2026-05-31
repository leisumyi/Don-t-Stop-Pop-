import './styles/ui.css';
import { GameStore } from './core/GameStore';
import { GameLoop } from './core/GameLoop';
import { StateMachine } from './core/StateMachine';
import { SaveSystem } from './core/SaveSystem';
import { SoundSystem } from './core/SoundSystem';
import { SceneSetup } from './three/SceneSetup';
import { BalloonManager } from './gameplay/BalloonManager';
import { ComboSystem } from './gameplay/ComboSystem';
import { EscapeMeter } from './gameplay/EscapeMeter';
import { DifficultyManager } from './gameplay/DifficultyManager';
import { HazardManager } from './gameplay/HazardManager';
import { ParticleSystem } from './gameplay/ParticleSystem';
import { PuppyActor } from './gameplay/PuppyActor';
import { MenuBalloons } from './gameplay/MenuBalloons';
import { ShopSystem } from './systems/ShopSystem';
import { PrestigeSystem } from './systems/PrestigeSystem';
import { BadgeSystem } from './systems/BadgeSystem';
import { CosmeticSystem } from './systems/CosmeticSystem';
import { BoostSystem } from './systems/BoostSystem';
import { HUD } from './ui/HUD';
import { ShopPanel } from './ui/ShopPanel';
import { StampCardPanel } from './ui/StampCardPanel';
import { FailScreen } from './ui/FailScreen';
import { PrestigePanel } from './ui/PrestigePanel';
import { TutorialOverlay, type TutorialPhase } from './ui/TutorialOverlay';
import { PhoneFrame } from './ui/PhoneFrame';
import { MainMenu } from './ui/MainMenu';
import { calculatePartyBucks, popsByTypeIncrement } from './core/Economy';
import { Balloon } from './gameplay/Balloon';
import { LOGICAL_HEIGHT } from './three/constants';
import { loadCloudTextures } from './three/cloudTextures';
import type { BalloonTypeId, HazardId } from './core/types';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('#game-canvas not found');

// Dev convenience: visit /?reset=1 to wipe persisted progress.
if (import.meta.env.DEV && new URLSearchParams(location.search).get('reset') === '1') {
  try {
    localStorage.removeItem('dontStopPop:save');
  } catch {
    /* noop */
  }
  history.replaceState({}, '', location.pathname + location.hash);
}

// Boot order: save -> store (with boost lookup) -> scene -> systems -> UI -> loop.
const save = new SaveSystem();
const store = new GameStore(save);
const fsm = new StateMachine();
const sound = new SoundSystem();

const scene = new SceneSetup(canvas);
const balloons = new BalloonManager(scene.balloonGroup);
const combo = new ComboSystem(store);
const escape = new EscapeMeter(store, () => onFail());
const difficulty = new DifficultyManager();
const hazards = new HazardManager(store, balloons, scene.cloudCoverGroup);
const particles = new ParticleSystem(scene.particleGroup);
const puppy = new PuppyActor(scene.actorGroup);
const menuBalloons = new MenuBalloons(scene.menuGroup, particles, (type) => playPopSound(type));

const cosmetics = new CosmeticSystem(store);
const boosts = new BoostSystem(store);
const badges = new BadgeSystem(store);
const prestige = new PrestigeSystem(store);
const shop = new ShopSystem(store, balloons, escape, hazards, puppy);

const phoneFrame = new PhoneFrame(store, cosmetics);
phoneFrame.bindBackgroundSetter((t, m, b) => scene.background.setSkyColors(t, m, b));
phoneFrame.bindBalloonPaletteSetter((p) => balloons.setPalette(p));
phoneFrame.bindPopEffectSetter((k) => particles.setEffect(k));

const tutorial = new TutorialOverlay(store);
const tutorialFlow = {
  lastPhase: 'inactive' as TutorialPhase,
  singleBalloonId: 0,
  singleStoppedAtCenter: false,
  scriptedSetSpawned: false,
  escapeBalloonId: 0,
  poppableBalloonIds: new Set<number>(),
};

const lastBadgesUnlocked = new Set(store.save.data.badgesUnlocked);

const hud = new HUD(store, prestige, {
  onShop: () => openShop(),
  onStampCard: () => openStamp(),
  onPrestige: () => openPrestige(),
  onToggleBgm: (muted) => sound.setBgmMuted(muted),
  onToggleSfx: (muted) => sound.setSfxMuted(muted),
  onHome: () => goHome(),
});

const shopPanel = new ShopPanel(store, shop, () => {
  if (fsm.state === 'SHOP_OPEN') fsm.transition('RUNNING');
});
const stampPanel = new StampCardPanel(store, badges, cosmetics, boosts, sound, () => {
  if (fsm.state === 'STAMP_CARD_OPEN') {
    if (failScreenOpen) {
      reopenFailScreenAfterStamp();
    } else {
      fsm.transition('RUNNING');
    }
  }
});
const failScreen = new FailScreen(store, prestige, {
  onTryAgain: () => startNewRun(),
  onStampCard: () => {
    if (fsm.canTransition('STAMP_CARD_OPEN')) fsm.transition('STAMP_CARD_OPEN');
    stampPanel.open();
  },
  onPrestige: () => {
    if (fsm.canTransition('PRESTIGE_CONFIRM')) fsm.transition('PRESTIGE_CONFIRM');
    prestigePanel.open();
  },
});
let failScreenOpen = false;
let lastFailSummary: any = null;
// True while a run is parked on the menu via the home button (its state is
// preserved so "Resume Game" picks up exactly where the player left off).
let runPaused = false;

const prestigePanel = new   PrestigePanel(
  store,
  prestige,
  () => {
    const gain = prestige.apply();
    if (gain > 0) {
      hud.refreshPrestigeButton();
      sound.play('prestige');
    }
    startNewRun();
  },
  () => {
    if (fsm.state === 'PRESTIGE_CONFIRM') fsm.transition('RUNNING');
    if (failScreenOpen) reopenFailScreenAfterStamp();
  },
);

function reopenFailScreenAfterStamp(): void {
  if (lastFailSummary) failScreen.open(lastFailSummary);
  if (fsm.canTransition('FAILED')) fsm.transition('FAILED');
}

// Pointer input: convert clientX/Y to world coords and try to pop.
canvas.addEventListener('pointerdown', (e) => {
  const w = scene.renderer.pointerToWorld(canvas, e.clientX, e.clientY);
  if (fsm.state === 'RUNNING') {
    const popped = tutorial.isActive() ? popAtTutorialTarget(w.x, w.y) : balloons.popAt(w.x, w.y);
    if (popped) {
      onPlayerPop(popped, e.clientX, e.clientY);
      if (
        tutorial.isActive() &&
        tutorial.getPhase() === 'single-balloon' &&
        popped.id === tutorialFlow.singleBalloonId &&
        popped.justFullyPopped
      ) {
        tutorial.advanceFromSingleBalloonPop();
      }
    }
  } else if (fsm.state === 'MAIN_MENU') {
    menuBalloons.popAt(w.x, w.y);
  }
});

function startNewRun(): void {
  runPaused = false;
  store.resetRun();
  combo.reset();
  escape.reset();
  shop.reset();
  puppy.reset();
  hazards.reset();
  difficulty.reset();
  difficulty.start(performance.now());
  balloons.clear();
  failScreen.close();
  failScreenOpen = false;
  resetTutorialFlow();
  if (fsm.state === 'BOOT' || fsm.state === 'FAILED' || fsm.state === 'MAIN_MENU') {
    if (tutorial.shouldRun()) {
      fsm.transition('RUNNING');
      tutorial.start();
    } else {
      fsm.transition('RUNNING');
    }
  } else if (fsm.canTransition('RUNNING')) {
    fsm.transition('RUNNING');
  }
  store.startRun();
}

function goHome(): void {
  if (fsm.state === 'MAIN_MENU') return;
  if (!fsm.canTransition('MAIN_MENU')) return;
  // Transition first so each panel's close handler (which only bounces back to
  // RUNNING while its own state is active) becomes a no-op. The run state in
  // `store.run` is left untouched so it can be resumed.
  fsm.transition('MAIN_MENU');
  shopPanel.close();
  stampPanel.close();
  prestigePanel.close();
  runPaused = true;
  scene.panCameraTo(-LOGICAL_HEIGHT, 1.4, () => {
    menuBalloons.start();
    menu.open({ paused: true });
  });
}

function openShop(): void {
  if (fsm.canTransition('SHOP_OPEN')) {
    fsm.transition('SHOP_OPEN');
    shopPanel.open();
  }
}

function openStamp(): void {
  if (fsm.state === 'FAILED') {
    failScreen.close();
    fsm.transition('STAMP_CARD_OPEN');
    stampPanel.open();
    return;
  }
  if (fsm.canTransition('STAMP_CARD_OPEN')) {
    fsm.transition('STAMP_CARD_OPEN');
    stampPanel.open();
  }
}

function openPrestige(): void {
  if (!prestige.isUnlocked()) return;
  if (fsm.canTransition('PRESTIGE_CONFIRM')) {
    fsm.transition('PRESTIGE_CONFIRM');
    prestigePanel.open();
  }
}

// ----- pop handling -----
function onPlayerPop(b: Balloon, clientX?: number, clientY?: number): void {
  if (b.justFullyPopped) {
    resolvePopReward(b, /*isAuto*/ false, clientX, clientY);
  } else {
    onPartialHit(b);
  }
}

function onAutoPop(b: Balloon, source: 'dart' | 'puppy'): void {
  if (tutorial.isActive()) return;
  if (!b.justFullyPopped) {
    onPartialHit(b);
    return;
  }
  // Convert balloon world position to client coords for floating text spawn.
  const screen = scene.renderer.worldToClient(canvas, b.position.x, b.position.y);
  resolvePopReward(b, /*isAuto*/ true, screen.x, screen.y, source);
}

function onPartialHit(_b: Balloon): void {
  sound.play('popThud');
}

function resolvePopReward(
  b: Balloon,
  isAuto: boolean,
  clientX?: number,
  clientY?: number,
  source?: 'dart' | 'puppy',
): void {
  combo.registerPop();
  const polishBucks = badges.getPolishBonusValue('party_bucks_bonus');
  const polishBonusChance = badges.getPolishBonusValue('bonus_buck_chance');
  const partyMultMult = store.permanentBoostValue('party_bucks_mult');
  const partyMultiplier = store.save.data.partyMultiplier + partyMultMult;
  const baseReward = b.config.reward;
  const bonusRoll = polishBonusChance > 0 && Math.random() < polishBonusChance ? 1.25 : 1;
  const reward = calculatePartyBucks(baseReward, store.run.combo, partyMultiplier, (1 + polishBucks) * bonusRoll);
  store.run.partyBucks += reward;
  store.run.stats.partyBucksEarned += reward;
  store.run.stats.popsTotal += 1;
  popsByTypeIncrement(store.run.stats.popsByType, b.type);
  // track pops during hazard
  for (const id of Object.keys(store.run.activeHazards) as HazardId[]) {
    store.run.stats.popsDuringHazard[id] = (store.run.stats.popsDuringHazard[id] ?? 0) + 1;
  }
  store.updateSave((s) => {
    s.persistent.totalBalloonsPopped += 1;
    s.persistent.totalBalloonsByType[b.type] += 1;
    s.persistent.totalPartyBucksEarned += reward;
  });
  store.bus.emit('partyBucks:change', { value: store.run.partyBucks, delta: reward });

  if (clientX !== undefined && clientY !== undefined) {
    store.bus.emit('floatingText:spawn', {
      x: clientX,
      y: clientY,
      text: `+${formatReward(reward)}`,
      golden: b.type === 'golden',
    });
  }
  particles.spawnBurst(
    b.position.x,
    b.position.y,
    b.type === 'golden' ? 1.5 : b.type === 'tank' ? 1.35 : 1,
    b.config.color,
  );

  // sound feedback per balloon type; the dog's pops get a deeper "chomp" pitch
  const pitchMul = source === 'puppy' ? 0.88 : 1;
  playPopSound(b.type, pitchMul);

  store.bus.emit('pop:registered', {
    type: b.type as BalloonTypeId,
    bucks: reward,
    x: b.position.x,
    y: b.position.y,
    combo: store.run.combo,
    isAuto,
  });

  evaluateBadges();
  hud.refreshPrestigeButton();
}

function playPopSound(type: BalloonTypeId, pitchMul = 1): void {
  switch (type) {
    case 'golden':
      sound.play('popGold', pitchMul);
      break;
    case 'tiny':
      sound.play('popTiny', pitchMul);
      break;
    case 'fineRisk':
      sound.play('popRisk', pitchMul);
      break;
    case 'tank':
      sound.play('popTank', pitchMul);
      break;
    default:
      sound.play('pop', pitchMul);
  }
}

function formatReward(n: number): string {
  if (n < 10) return n.toFixed(1).replace(/\.0$/, '');
  return Math.floor(n).toString();
}

function evaluateBadges(): void {
  const newly = badges.evaluate();
  if (newly.length === 0) return;
  for (const id of newly) lastBadgesUnlocked.add(id);
  if (newly.length > 0) sound.play('badge');
}

function onFail(): void {
  if (!fsm.canTransition('FAILED')) return;
  const meterPct = (store.run.escapeMeter / store.run.escapeMeterMax) * 100;
  const newly = badges.evaluate({ lostMeterPctAtFail: meterPct });
  for (const id of newly) lastBadgesUnlocked.add(id);

  store.updateSave((s) => {
    if (store.run.stats.elapsed > s.persistent.longestRunSeconds) {
      s.persistent.longestRunSeconds = store.run.stats.elapsed;
    }
    if (store.run.stats.bestCombo > s.persistent.highestCombo) {
      s.persistent.highestCombo = store.run.stats.bestCombo;
    }
    if (store.run.stats.popsTotal > s.persistent.highestPopsInRun) {
      s.persistent.highestPopsInRun = store.run.stats.popsTotal;
    }
  });

  fsm.transition('FAILED');
  store.failRun('escape-meter-full');
  sound.play('fail');
  failScreenOpen = true;
  lastFailSummary = {
    partyBucksLost: store.run.partyBucks,
    popsThisRun: store.run.stats.popsTotal,
    secondsThisRun: store.run.stats.elapsed,
    badgesEarned: newly,
  };
  failScreen.open(lastFailSummary);
}

// ----- game loop -----
const loop = new GameLoop((dt) => {
  if (fsm.state === 'RUNNING') {
    const tutorialActive = tutorial.isActive();
    const tutorialPhase = tutorial.getPhase();

    if (tutorialFlow.lastPhase !== tutorialPhase) {
      if (tutorialPhase === 'single-balloon') {
        tutorialFlow.singleBalloonId = 0;
        tutorialFlow.singleStoppedAtCenter = false;
        tutorialFlow.scriptedSetSpawned = false;
        tutorialFlow.escapeBalloonId = 0;
        tutorialFlow.poppableBalloonIds.clear();
      } else if (tutorialPhase === 'three-balloons') {
        balloons.clear();
        tutorialFlow.scriptedSetSpawned = false;
        tutorialFlow.escapeBalloonId = 0;
        tutorialFlow.poppableBalloonIds.clear();
      } else if (tutorialPhase === 'escape-warning') {
        balloons.clear();
        tutorial.hideRing();
      } else if (tutorialPhase === 'inactive') {
        tutorial.hideRing();
        resetTutorialFlow();
      }
      tutorialFlow.lastPhase = tutorialPhase;
    }

    difficulty.update(dt);
    store.run.stats.elapsed = difficulty.elapsed;
    balloons.setProgressionMultipliers(
      difficulty.getProgressionSpeedFactor(),
      difficulty.getProgressionSpawnFactor(),
    );

    balloons.update(
      dt,
      difficulty.phase,
      (escaped) => {
        if (tutorialActive) {
          if (tutorialPhase === 'three-balloons' && escaped.id === tutorialFlow.escapeBalloonId) {
            tutorial.showEscapeWarning();
            tutorialFlow.escapeBalloonId = 0;
          }
          return;
        }
        escape.addEscape(escaped.type);
        if (escaped.position.y > 0) {
          // brief flash for any escape
          store.bus.emit('screen:flash', { intensity: 0.3 });
        }
      },
      !tutorialActive,
    );

    if (tutorialActive) {
      if (tutorialPhase === 'single-balloon') {
        let target = balloons.balloons.find((b) => b.id === tutorialFlow.singleBalloonId) ?? null;
        if (!target) {
          target = balloons.spawn(difficulty.phase, { type: 'normal', x: 0 });
          if (target) {
            target.setVelocity(0, 68);
            tutorialFlow.singleBalloonId = target.id;
            tutorialFlow.singleStoppedAtCenter = false;
          }
        }

        if (target && !target.popped) {
          if (!tutorialFlow.singleStoppedAtCenter && target.position.y >= 0) {
            tutorialFlow.singleStoppedAtCenter = true;
            target.position.y = 0;
            target.setVelocity(0, 0);
            target.mesh.position.set(target.position.x, 0, target.mesh.position.z);
          }
          const screen = scene.renderer.worldToClient(canvas, target.mesh.position.x, target.mesh.position.y);
          tutorial.showRing(screen.x, screen.y, Math.max(target.halfWidth, target.halfHeight) * 2 + 28);
        } else {
          tutorial.hideRing();
        }
      } else if (tutorialPhase === 'three-balloons' && !tutorialFlow.scriptedSetSpawned) {
        const left = balloons.spawn(difficulty.phase, { type: 'normal', x: -95 });
        const right = balloons.spawn(difficulty.phase, { type: 'normal', x: 95 });
        const escapeBalloon = balloons.spawn(difficulty.phase, { type: 'normal', x: 0 });

        if (left) {
          left.setVelocity(0, 52);
          tutorialFlow.poppableBalloonIds.add(left.id);
        }
        if (right) {
          right.setVelocity(0, 56);
          tutorialFlow.poppableBalloonIds.add(right.id);
        }
        if (escapeBalloon) {
          escapeBalloon.setVelocity(0, 78);
          tutorialFlow.escapeBalloonId = escapeBalloon.id;
        }
        tutorialFlow.scriptedSetSpawned = true;
      }
    } else {
      tutorial.hideRing();
    }

    if (!tutorialActive) {
      hazards.update(dt, difficulty.phase);
      const idleSpeedBonus =
        store.permanentBoostValue('idle_speed_mult') +
        badges.getPolishBonusValue('idle_speed_bonus');
      shop.update(dt, idleSpeedBonus, (b, source) => {
        if (b) onAutoPop(b, source);
      });
    }

    combo.update(dt);
    puppy.update(dt);
    particles.update(dt);
    scene.update(dt);

    // periodic badge evaluation for time-based / combo / hazard-survived
    badgeEvalAccumulator += dt;
    if (badgeEvalAccumulator >= 1) {
      badgeEvalAccumulator = 0;
      evaluateBadges();
    }
  } else {
    // still tick particles and parallax even when paused so the scene feels alive
    menuBalloons.update(dt);
    particles.update(dt);
    scene.update(dt);
  }

  scene.render();
});

function resetTutorialFlow(): void {
  tutorialFlow.lastPhase = 'inactive';
  tutorialFlow.singleBalloonId = 0;
  tutorialFlow.singleStoppedAtCenter = false;
  tutorialFlow.scriptedSetSpawned = false;
  tutorialFlow.escapeBalloonId = 0;
  tutorialFlow.poppableBalloonIds.clear();
}

function popAtTutorialTarget(wx: number, wy: number): Balloon | null {
  const phase = tutorial.getPhase();
  if (phase !== 'single-balloon' && phase !== 'three-balloons') return null;

  for (let i = balloons.balloons.length - 1; i >= 0; i--) {
    const b = balloons.balloons[i];
    if (b.popped) continue;
    if (!b.hitTest(wx, wy)) continue;

    if (phase === 'single-balloon') {
      if (b.id !== tutorialFlow.singleBalloonId) return null;
      b.hit();
      return b;
    }

    if (b.id === tutorialFlow.escapeBalloonId) return null;
    if (!tutorialFlow.poppableBalloonIds.has(b.id)) return null;
    b.hit();
    return b;
  }
  return null;
}

let badgeEvalAccumulator = 0;

// Apply early-difficulty-softening permanent boost on boot.
difficulty.setEarlySoftening(store.permanentBoostValue('early_difficulty_softening'));

// Mirror FSM state onto the phone frame so CSS can hide HUD chrome while the
// starting menu is showing.
const phoneFrameEl = document.getElementById('phone-frame');
function reflectGameState(state: string): void {
  if (phoneFrameEl) phoneFrameEl.dataset.gameState = state;
}
fsm.onChange((state) => {
  reflectGameState(state);
  // Lets the tutorial finalize its last step when a panel (e.g. the shop) opens.
  store.bus.emit('state:change', undefined);
});

// Starting menu: a back-garden birthday party. The camera sits on the party
// scene below the gameplay area until the player taps Start Game.
const menu = new MainMenu(store, {
  onStart: () => void onMenuStart(),
  onGoodyBag: () => stampPanel.open(),
});

function onMenuStart(): Promise<void> {
  return runPaused ? resumeFromMenu() : Promise.resolve(startFromMenu());
}

function resumeFromMenu(): Promise<void> {
  return menu.playStartAnimation().then(() => {
    scene.panCameraTo(0, 1.4, () => {
      menu.close();
      menuBalloons.stop();
      runPaused = false;
      if (fsm.canTransition('RUNNING')) fsm.transition('RUNNING');
    });
  });
}

function startFromMenu(): void {
  void menu.playStartAnimation().then(() => {
    // small confetti burst over the invitation, then pan up into the sky.
    particles.spawnBurst(0, -LOGICAL_HEIGHT + 40, 2, 0xff8fb1);
    particles.spawnBurst(-90, -LOGICAL_HEIGHT, 1.4, 0xffd966);
    particles.spawnBurst(90, -LOGICAL_HEIGHT, 1.4, 0xa3e4c8);
    scene.panCameraTo(0, 1.4, () => {
      menu.close();
      menuBalloons.stop();
      // startNewRun transitions MAIN_MENU -> RUNNING and begins spawning, so
      // gameplay only kicks in once the camera has finished its pan.
      startNewRun();
    });
  });
}

// First boot path: sit on the party scene in MAIN_MENU and show the invitation.
reflectGameState('MAIN_MENU');
fsm.transition('MAIN_MENU');
scene.setCameraY(-LOGICAL_HEIGHT);
menu.open();
menuBalloons.start();

// Load sprites before the loop spawns anything; each falls back to a
// procedural texture if the asset can't be fetched.
void Promise.all([
  Balloon.preloadSprite(),
  PuppyActor.preloadSprite(),
  sound.preload(),
  scene.partyScene.load(),
  loadCloudTextures(),
]).then(() => loop.start());

store.bus.on('shop:purchase', () => sound.play('shop'));
store.bus.on('shop:instant', () => sound.play('shop'));
store.bus.on('puppy:jump', () => {
  if (Math.random() < 0.2) sound.play('bark');
});

// Ensure save flushes on tab close.
window.addEventListener('beforeunload', () => save.flush());

// expose for dev/debug from console
declare global {
  interface Window {
    __dontStopPop?: any;
  }
}
window.__dontStopPop = {
  store,
  save,
  fsm,
  loop,
  sound,
  escape,
  balloons,
  hazards,
  difficulty,
  shop,
  prestige,
  badges,
  startNewRun,
  reset: () => {
    save.hardReset();
    location.reload();
  },
  resetBadgeCleaning: (badgeId: string) => {
    const ok = badges.resetCleaning(badgeId);
    stampPanel.refreshIfOpen();
    return ok;
  },
  unlockAllBadges: () => {
    const newly = badges.unlockAll();
    stampPanel.refreshIfOpen();
    return newly;
  },
};

// Dev convenience: visit /?resetBadge=combo_x5 to re-dirty a specific badge.
// Visit /?unlockAllBadges=1 to unlock every badge (dirty).
if (import.meta.env.DEV) {
  const params = new URLSearchParams(location.search);
  const resetBadge = params.get('resetBadge');
  if (resetBadge) {
    badges.resetCleaning(resetBadge);
    stampPanel.refreshIfOpen();
    history.replaceState({}, '', location.pathname + location.hash);
  }
  if (params.get('unlockAllBadges')) {
    badges.unlockAll();
    stampPanel.refreshIfOpen();
    history.replaceState({}, '', location.pathname + location.hash);
  }
}
