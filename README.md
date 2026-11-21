# THE LAST BELL — Chapter 01: The Locked Classroom

Playable 2D psychological mystery thriller built with **Phaser 4.2.1**, **TypeScript**, **React 19**, **Vite 8.3**, and **Tailwind CSS v4**, featuring an Arabic-primary (`dir="rtl"`) DOM overlay, self-hosted SIL OFL 1.1 fonts, and modular data-driven story systems.

## Requirements

- Node.js `v20+` (verified on `v22.23.2`)
- npm `10+`

## Install & Run Locally

```bash
# Install dependencies (clean npm install, no special flags required)
npm install

# Run development server on port 3000
npm run dev

# Typecheck
npm run lint

# Verify JSON narrative data, flags, and scene assets
npm run verify

# Production build
npm run build
```

## Architecture Overview

- `src/game/scenes/`: Phaser 4.2.1 scenes (`BootScene`, `PreloadScene`, `MainMenuScene`, `IntroScene`, `ClassroomScene`, `PuzzleScene`, `EndingScene`).
- `src/game/GameEngine.ts`: Dynamically code-split Phaser engine loader mounted after the Main Menu overlay renders.
- `src/systems/`: Reusable engine-agnostic core systems (`StoryManager`, `SceneAssembler`, `CameraDirector`, `TimerManager`, `DialogueSystem`, `EvidenceSystem`, `PuzzleManager`, `InteractionSystem`, `SaveManager`, `AudioManager`, `UiSettings`, `EventBus`).
- `src/ui/`: Arabic RTL DOM overlay components (`MainMenuOverlay`, `HudOverlay`, `DialogueOverlay`, `NotebookModal`, `PuzzleModal`, `PauseSettingsModal`).
- `public/assets/config/scenes/`: Independent normalized JSON layout configs (`academy_exterior.json`, `academy_entrance.json`, `classroom_day.json`, `classroom_dark.json`, `classroom_emergency.json`, `desk7_closeup.json`, `projector_closeup.json`, `door_closeup.json`, `puzzle_seating.json`).
- `public/assets/config/data/`: Story & puzzle data (`evidence.json`, `dialogues.json`, `puzzles.json`).
- `public/assets/fonts/`: Self-hosted `.woff2` font files (`IBM Plex Sans Arabic`, `Cinzel`, `JetBrains Mono`, `Plus Jakarta Sans` — see `NOTICE`).
- `assets-originals/` & `docs/reference-art/`: Source PNG backups and Milestone 1 reference art kept outside `dist/`.
- `scripts/verify-data.mjs`: Automated data/asset integrity check (`npm run verify`).
- `docs/`: Production documentation (`DECISIONS.md`, `DEVELOPMENT_PLAN.md`, `ART_DIRECTION_GUIDE.md`, `CHARACTER_SPECS.md`, `ENVIRONMENT_AND_UI_SPEC.md`, `SCENE_DOCUMENTATION.md`, `ASSET_MANIFEST.md`, `PROJECT_STATUS.md`).
