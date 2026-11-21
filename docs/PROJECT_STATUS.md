# Project Status — THE LAST BELL (Chapter 01: The Locked Classroom)

**Last Updated:** Technical Health & Optimization Pass (Batch 4)  
**Current Engine:** Phaser `4.2.1` + React `19.0.1` + TypeScript `7.0.2` + Vite `8.3.0` + Tailwind CSS `4.3.3`  
**Scope Status:** Chapter 01 ("The Locked Classroom") playable end-to-end with verified build, typecheck, and data/asset integrity suite (`npm run verify`).

---

## 1. Initial Workspace & Production Summary

- **Base Architecture:** Vite `8.3.0` + React `19.0.1` + TypeScript `7.0.2` + Tailwind CSS `@tailwindcss/vite 4.3.3` + **Phaser `4.2.1`** (dynamically code-split after Main Menu paint).
- **Art Direction & Reference Boards:** `docs/ART_DIRECTION_GUIDE.md`, `docs/CHARACTER_SPECS.md`, `docs/ENVIRONMENT_AND_UI_SPEC.md`, and 3 Milestone 1 visual reference boards stored under `docs/reference-art/` (excluded from production `dist/`).
- **Scene Layout Deliverables:** 9 JSON scene configs under `public/assets/config/scenes/`, `docs/SCENE_DOCUMENTATION.md`, `scripts/render_layout_previews.py`, and schematic previews under `docs/previews/`.
- **Optimized Asset Pipeline (`public/assets/`):** All 54 raster PNG assets (8 backgrounds, 3 furniture props, 10 world/seated character sprites, 33 portraits) converted to `.webp` via ImageMagick (`15.75 MB` -> `1.01 MB`, 93.6% reduction), with original PNG backups preserved in `assets-originals/`.
- **Self-Hosted Typography (`public/assets/fonts/`):** `IBM Plex Sans Arabic`, `Cinzel`, `JetBrains Mono`, and `Plus Jakarta Sans` served locally via `@font-face` (`font-display: swap`, SIL OFL 1.1 documented in `NOTICE`).
- **Core Game Systems (`src/systems/`):** `StoryManager`, `SceneAssembler`, `CameraDirector`, `TimerManager`, `DialogueSystem`, `EvidenceSystem`, `PuzzleManager`, `InteractionSystem`, `SaveManager`, `AudioManager`, `UiSettings`, and `EventBus`, plus `public/assets/config/data/` (`evidence.json`, `dialogues.json`, `puzzles.json`) and automated validation via `scripts/verify-data.mjs`.

---

## 2. Verified Available Tools & Pipeline Capabilities

| Capability | Available Tool(s) | Notes & Honest Constraints |
|---|---|---|
| **Image Generation & Optimization** | `generate_image` + ImageMagick (`/usr/bin/convert`), Python 3 | Original PNGs preserved in `assets-originals/`; runtime raster sprites/backgrounds served as `.webp`. |
| **Vector / Programmatic Assets** | Hand-authored SVG & Phaser Graphics / Canvas textures | Transparent interactive props & vector UI icons under `public/assets/objects/` & `public/assets/ui/`. |
| **Code Execution, Build & Data Verification** | Node `v22.23.2`, npm `10+`, `npm run lint`, `npm run build`, `npm run verify` | Clean `npm install` without `--legacy-peer-deps`; static checks + Vite/Rolldown bundling + JSON/flag/asset validator. |
| **Browser Verification** | Runtime visual/audio playtest performed externally by user | Headless container checks focus on build, TypeScript lint, logic unit scripts, and data/asset integrity. |

---

## 3. Milestone Tracker

| Milestone | Title | Scope / Batch Notes | Status |
|---|---|---|---|
| **0–4** | Planning, Art Direction, Scene Schemas, Core Architecture | Data-driven JSON schemas, Phaser 4.2.1 integration, RTL DOM overlay, Canon `D1–D6` | **Completed** |
| **5–6** | Asset Production (Environments, Props, Characters, Portraits, UI) | Classroom backgrounds, seated/standing student sprites, expressions, SVG icons | **Completed** |
| **7** | Intro Cinematic & Classroom Opening | Exterior/entrance sequence, classroom blackout (`16:20`), Adam broadcast, skip intro for repeat runs | **Completed** |
| **8** | Exploration, Evidence & Notebook | 5 interactive classroom hotspots, Desk 7 close-up DOM caption, 3-tab Investigation Notebook | **Completed** |
| **9** | Puzzle 01: The Seating Order (Deduction Rework — Batch 2) | Board cipher `4 - 1 - ? - 2 - 6 - 3 - 5`, elimination deduction, progressive reveal & hints | **Completed** |
| **10** | Character Conversations & Conditional Dialogue | 5 classmate conversations + cinematic `CameraDirector` shots & typewriter input | **Completed** |
| **11** | Timer, Disappearance & Chapter Ending | `59:59` countdown, Karim's tablet summons, Room 0 teaser, timeout & completion endings | **Completed** |
| **12** | Onboarding, Arabic-First UX & Audio (Batch 3) | Arabic-first UI toggle, onboarding controls hint, WebAudio ambience & typewriter SFX, Save v1 | **Completed** |
| **13** | Technical Health & Optimization (Batch 4) | Clean `npm install`, WebP conversion, Phaser code-splitting, self-hosted OFL fonts, `verify-data.mjs` | **Completed & Verified** |
