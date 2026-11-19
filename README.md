# THE LAST BELL — Chapter 01: The Locked Classroom

Playable 2D psychological mystery thriller built with **Phaser 3**, **TypeScript**, **React**, **Vite**, and **Tailwind CSS**, featuring an Arabic-primary (`dir="rtl"`) DOM overlay and modular data-driven story systems.

## Requirements

- Node.js `v20+` (verified on `v22.23.2`)
- npm `10+`

## Install & Run Locally

```bash
# Install dependencies
npm install

# Run development server on port 3000
npm run dev

# Typecheck
npm run lint

# Production build
npm run build
```

## Architecture Overview

- `src/game/scenes/`: Phaser 3 scenes (`BootScene`, `PreloadScene`, `MainMenuScene`, `IntroScene`, `ClassroomScene`, `PuzzleScene`, `EndingScene`).
- `src/systems/`: Reusable engine-agnostic core systems (`StoryManager`, `SceneAssembler`, `TimerManager`, `DialogueSystem`, `EvidenceSystem`, `PuzzleManager`, `InteractionSystem`, `SaveManager`, `AudioManager`, `EventBus`).
- `src/ui/`: Arabic RTL DOM overlay components (`MainMenuOverlay`, `HudOverlay`, `DialogueOverlay`, `NotebookModal`, `PuzzleModal`, `PauseSettingsModal`).
- `public/assets/config/scenes/`: Independent normalized JSON layout configs (`academy_exterior.json`, `classroom_day.json`, `classroom_dark.json`, `classroom_emergency.json`, `projector_closeup.json`, `door_closeup.json`, `puzzle_seating.json`).
- `public/assets/config/data/`: Story & puzzle data (`evidence.json`, `dialogues.json`, `puzzles.json`).
- `docs/`: Production documentation (`DECISIONS.md`, `DEVELOPMENT_PLAN.md`, `ART_DIRECTION_GUIDE.md`, `CHARACTER_SPECS.md`, `ENVIRONMENT_AND_UI_SPEC.md`, `SCENE_DOCUMENTATION.md`, `ASSET_MANIFEST.md`, `PROJECT_STATUS.md`).
