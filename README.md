# Don't Stop Pop!

A cozy-but-chaotic portrait balloon-popping clicker. Tap balloons before they escape, earn Party Bucks, buy silly upgrades, collect badges, and **Buy a New Party!** to reset for stronger future runs.

**Tech:** TypeScript + Vite + Three.js
**Target:** Mobile-first portrait web game
**Deploy:** GitHub Pages

## Local development

```bash
cd DontStopPop
npm install
npm run dev
```

Then open the printed URL (default `http://localhost:5173/`).

## Build

```bash
npm run build
npm run preview
```

The static output lands in `dist/`.

## Test

```bash
npm test            # one-shot run
npm run test:watch  # watch mode
```

## Deploy

A GitHub Actions workflow at `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. To enable it:

1. In the repo settings, set Pages source to **GitHub Actions**.
2. Push to `main`; the workflow builds `DontStopPop/` and publishes `dist/`.

## Project structure

See [DevelopmentPlan.md](DevelopmentPlan.md) for the full design and milestone roadmap.

```text
DontStopPop/
  index.html              # phone-frame shell
  src/
    main.ts               # entry point
    core/                 # GameLoop, StateMachine, GameStore, Economy, SaveSystem
    three/                # Renderer, SceneSetup, Camera, ParallaxBackground
    gameplay/             # BalloonManager, Balloon, HazardManager, ComboSystem,
                          # DifficultyManager, EscapeMeter
    systems/              # ShopSystem, UpgradeSystem, PrestigeSystem,
                          # BadgeSystem, CosmeticSystem, StampCardSystem
    ui/                   # HUD, ShopPanel, StampCardPanel, FailScreen,
                          # TutorialOverlay, PrestigePanel, PhoneFrame
    data/                 # balloons, upgrades, badges, cosmetics, failMessages,
                          # difficultyPhases, boosts
    styles/               # tokens.css, themes.css, ui.css
  tests/                  # vitest unit tests for systems
```
