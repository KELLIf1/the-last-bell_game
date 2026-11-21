# Asset Manifest & Production Plan — THE LAST BELL (Chapter 01: The Locked Classroom)

**Scope Constraint:** Contains **Chapter 01 assets only**. Zero assets from Chapters 02–06 are included.  
**Status Pipeline:** `PLANNED` → `GENERATED` → `PROCESSED` → `VALIDATED` → `ORGANIZED` → `INTEGRATED` → `TESTED`  
**Honesty Policy:** Assets produced via `generate_image` + ImageMagick processing are marked `AI-Raster + IM-Processed`; crisp transparent vector props/UI elements are marked `SVG / Programmatic`; audio tracks synthesized in-browser without external studio files are marked `Procedural WebAudio`.

---

## 1. Backgrounds (8 Master Cohesive Shots — Converted to WebP, Source PNGs Archived in `assets-originals/`)

| Asset ID | Filename | Category | Scene(s) | Intended Use | Dimensions | Format | Transparency | Animation | Dependencies | Production Method | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `bg_academy_exterior` | `public/assets/backgrounds/academy_exterior.webp` | Background | `academy_exterior`, `main_menu` | Rainy twilight facade with lit second-floor windows & wet reflections | `1280×720` | WebP | Opaque | Camera slow pan | `MASTER_SCENE_CONCEPT.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `bg_academy_entrance` | `public/assets/backgrounds/academy_entrance.webp` | Background | `academy_entrance` | Closer Shot 02 glass double entrance doors & wet stone stairs | `1280×720` | WebP | Opaque | Camera push | `MASTER_SCENE_CONCEPT.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `bg_classroom_day` | `public/assets/backgrounds/classroom_day.webp` | Background | `classroom_day` | Classroom 3B at `16:20` overcast rain light (clean open floor for depth-sorted desks) | `1280×720` | WebP | Opaque | Static backdrop | `classroom_day.json` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `bg_classroom_dark` | `public/assets/backgrounds/classroom_dark.webp` | Background | `classroom_dark` | Blackout classroom with volumetric projector cone on digital blackboard | `1280×720` | WebP | Opaque | Flash + dust motes FX | `classroom_dark.json` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `bg_classroom_emergency` | `public/assets/backgrounds/classroom_emergency.webp` | Background | `classroom_emergency` | Main playable classroom under storm window shadows & red keypad glow | `1280×720` | WebP | Opaque | Static + overlay FX | `classroom_emergency.json` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `bg_desk7_closeup` | `public/assets/backgrounds/classroom_desk7_closeup.webp` | Background | `desk7_closeup` | Shot 06 close-up of Elena's empty 7th desk with notebook, pencil & cut photo | `1280×720` | WebP | Opaque | Inspect modal | `desk7_closeup.json` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `bg_projector_closeup` | `public/assets/backgrounds/classroom_projector_closeup.webp` | Background | `projector_closeup` | Close-up glowing digital blackboard for Adam broadcast, Elena photo & `59:59` | `1280×720` | WebP | Opaque | Scanline & feed FX | `projector_closeup.json` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `bg_door_closeup` | `public/assets/backgrounds/classroom_door_closeup.webp` | Background | `door_closeup` | Close-up modern wood-and-steel door, frosted slit & crimson keypad | `1280×720` | WebP | Opaque | Camera zoom push | `door_closeup.json` | `AI-Raster + IM-WebP` | `INTEGRATED` |

---

## 2. Characters — World Sprites (Standing + Seated) & Dialogue Portraits (Chapter 01 Scope)

### 2A. In-Scene Full-Body Standing & Seated World Sprites (`origin: [0.5, 1.0]`, `by_y` depth)

| Asset ID | Filename | Category | Scene(s) | Intended Use | Dimensions | Format | Transparency | Animation | Dependencies | Production Method | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `char_samer_body` | `public/assets/characters/world/samer_world.webp` | Character | `classroom_day`, `classroom_dark`, `classroom_emergency` | Samer playable character standing beside his desk | `256×512` | WebP | Alpha Transparent (`WebP RGBA`) | Walk / facing flip | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `char_nour_body` | `public/assets/characters/world/nour_world.webp` | Character | `classroom_day`, `classroom_dark`, `classroom_emergency` | Nour standing anxiously near the tall left windows | `256×512` | WebP | Alpha Transparent (`WebP RGBA`) | Grounded sprite | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `char_layan_seated` | `public/assets/characters/world/layan_seated.webp` | Character | `classroom_day`, `classroom_dark`, `classroom_emergency` | Layan seated at Front Row desk writing notes | `320×448` | WebP | Alpha Transparent (`WebP RGBA`) | Behind-desk occlusion | `MASTER_SCENE_CONCEPT.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `char_yacine_seated` | `public/assets/characters/world/yacine_seated.webp` | Character | `classroom_day`, `classroom_dark`, `classroom_emergency` | Yacine seated at Front Row desk with arms crossed | `320×448` | WebP | Alpha Transparent (`WebP RGBA`) | Behind-desk occlusion | `MASTER_SCENE_CONCEPT.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `char_mariam_seated` | `public/assets/characters/world/mariam_seated.webp` | Character | `classroom_day`, `classroom_dark`, `classroom_emergency` | Mariam seated near right archival wall | `320×448` | WebP | Alpha Transparent (`WebP RGBA`) | Behind-desk occlusion | `MASTER_SCENE_CONCEPT.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `char_karim_seated` | `public/assets/characters/world/karim_seated.webp` | Character | `classroom_day`, `classroom_dark`, `classroom_emergency` | Karim seated at Rear Row desk with glowing tablet | `320×448` | WebP | Alpha Transparent (`WebP RGBA`) | Behind-desk occlusion | `MASTER_SCENE_CONCEPT.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `char_{layan,yacine,karim,mariam}_body` | `public/assets/characters/world/{id}_world.webp` | Character | `door_closeup`, fallback | Full standing silhouettes (used for Karim's brief Scene 06 exit) | `256×512` | WebP | Alpha Transparent (`WebP RGBA`) | Facing flip | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `obj_desk_wooden` / `obj_chair_wooden` / `obj_chair_board` | `public/assets/objects/{desk_wooden,chair_wooden,chair_board}.webp` | Prop | `classroom_*` | Extracted wooden-top metal student desk & empty chair props (7 desks, 3 rows) | `256×256` | WebP | Alpha Transparent (`WebP RGBA`) | `by_y` depth occlusion | `MASTER_SCENE_CONCEPT.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |

### 2B. Dialogue & Broadcast Portraits (4 Expressions + Speaking State per Student)

Expressions for each student (`samer`, `layan`, `yacine`, `nour`, `karim`, `mariam`): `neutral`, `worried`, `angry`, `sad`, plus `speaking` variant (`6 × 5 = 30` portrait assets).

| Asset ID Group | Filename Pattern | Category | Scene(s) | Intended Use | Dimensions | Format | Transparency | Animation | Dependencies | Production Method | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `port_samer_*` | `public/assets/characters/portraits/samer/{neutral,worried,angry,sad,speaking}.webp` | Portrait | Dialogue Overlay | Samer RTL dialogue portrait (5 states) | `384×384` | WebP | Framed (`#0F172A`) | State swap on speaking/emotion | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `port_layan_*` | `public/assets/characters/portraits/layan/{neutral,worried,angry,sad,speaking}.webp` | Portrait | Dialogue Overlay | Layan RTL dialogue portrait (5 states) | `384×384` | WebP | Framed (`#0F172A`) | State swap on speaking/emotion | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `port_yacine_*` | `public/assets/characters/portraits/yacine/{neutral,worried,angry,sad,speaking}.webp` | Portrait | Dialogue Overlay | Yacine RTL dialogue portrait (5 states) | `384×384` | WebP | Framed (`#0F172A`) | State swap on speaking/emotion | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `port_nour_*` | `public/assets/characters/portraits/nour/{neutral,worried,angry,sad,speaking}.webp` | Portrait | Dialogue Overlay | Nour RTL dialogue portrait (5 states) | `384×384` | WebP | Framed (`#0F172A`) | State swap on speaking/emotion | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `port_karim_*` | `public/assets/characters/portraits/karim/{neutral,worried,angry,sad,speaking}.webp` | Portrait | Dialogue Overlay | Karim RTL dialogue portrait (5 states) | `384×384` | WebP | Framed (`#0F172A`) | State swap on speaking/emotion | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `port_mariam_*` | `public/assets/characters/portraits/mariam/{neutral,worried,angry,sad,speaking}.webp` | Portrait | Dialogue Overlay | Mariam RTL dialogue portrait (5 states) | `384×384` | WebP | Framed (`#0F172A`) | State swap on speaking/emotion | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `port_adam_broadcast` | `public/assets/characters/portraits/adam/{neutral,intense}.webp` | Portrait | `projector_closeup`, Dialogue | Adam Mourad broadcast video portrait (Ch1 only) | `384×384` | WebP | Framed (`#080E1A`) | Subtle border/expression swap | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |
| `port_elena_archival` | `public/assets/characters/portraits/elena/archival.webp` | Portrait | `projector_closeup` | Elena Mourad archival photo shown by Adam | `384×384` | WebP | Framed (Archival) | Static archival fade | `CHARACTER_SPECS.md` | `AI-Raster + IM-WebP` | `INTEGRATED` |

---

## 3. Interactive & Environmental Objects (Transparent Separate Assets)

| Asset ID | Filename | Category | Scene(s) | Intended Use | Dimensions | Format | Transparency | Animation | Dependencies | Production Method | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `obj_desk_student` | `public/assets/objects/desk_student.svg` | Object | `classroom_*` | Student desk (7-seat arrangement, Seat 7 empty) | `160×128` | SVG | Alpha Transparent | Static | `classroom_emergency.json` | `SVG / Programmatic` | `VALIDATED` |
| `obj_chair_student` | `public/assets/objects/chair_student.svg` | Object | `classroom_*` | Student chair matching desks | `96×112` | SVG | Alpha Transparent | Static | `classroom_emergency.json` | `SVG / Programmatic` | `VALIDATED` |
| `obj_board` | `public/assets/objects/board.svg` | Object | `classroom_*` | Smart whiteboard with `4-1-?-2-6-3-5` & handwritten note | `400×200` | SVG | Alpha Transparent | Hover highlight | `classroom_emergency.json` | `SVG / Programmatic` | `INTEGRATED` |
| `obj_projector` | `public/assets/objects/projector.svg` | Object | `classroom_*` | Ceiling projector unit (interactive in Scene 07 finale) | `140×80` | SVG | Alpha Transparent | LED blink | `classroom_emergency.json` | `SVG / Programmatic` | `INTEGRATED` |
| `obj_teachers_desk` | `public/assets/objects/teachers_desk.svg` | Object | `classroom_day`, `classroom_emergency` | Teacher's desk holding old seating chart & memo | `220×140` | SVG | Alpha Transparent | Hover highlight | `classroom_emergency.json` | `SVG / Programmatic` | `INTEGRATED` |
| `obj_wall_clock` | `public/assets/objects/wall_clock.svg` | Object | `classroom_day`, `classroom_emergency` | Stopped wall clock at `16:20` (`Time remembers`) | `128×128` | SVG | Alpha Transparent | Static (stopped) | `classroom_emergency.json` | `SVG / Programmatic` | `INTEGRATED` |
| `obj_bookshelves` | `public/assets/objects/bookshelves.svg` | Object | `classroom_day`, `classroom_emergency` | Background classroom bookshelf | `140×240` | SVG | Alpha Transparent | Static | `classroom_emergency.json` | `SVG / Programmatic` | `VALIDATED` |
| `obj_school_bags` | `public/assets/objects/school_bags.svg` | Object | `classroom_day`, `classroom_emergency` | Student backpacks placed beside desks | `96×96` | SVG | Alpha Transparent | Static | `classroom_emergency.json` | `SVG / Programmatic` | `VALIDATED` |
| `obj_papers_notes` | `public/assets/objects/papers_notes.svg` | Object | `classroom_emergency`, `puzzle_seating` | Old seating chart sheet & handwritten margin note | `128×128` | SVG | Alpha Transparent | Static | `evidence.json` | `SVG / Programmatic` | `VALIDATED` |
| `obj_class_photo` | `public/assets/objects/class_photo.svg` | Object | `classroom_emergency`, `puzzle_seating` | Cut group class photograph (Seat 7 desk) | `160×128` | SVG | Alpha Transparent | Hover highlight | `classroom_emergency.json` | `SVG / Programmatic` | `INTEGRATED` |
| `obj_attendance_register` | `public/assets/objects/attendance_register.svg` | Object | `classroom_emergency` | Damaged attendance ledger (illegible removed entry per D2) | `128×128` | SVG | Alpha Transparent | Hover highlight | `classroom_emergency.json` | `SVG / Programmatic` | `INTEGRATED` |
| `obj_school_tablet` | `public/assets/objects/school_tablet.svg` | Object | `classroom_emergency`, `door_closeup` | Karim's glowing school tablet (D4) | `96×72` | SVG | Alpha Transparent | Screen pulse | `door_closeup.json` | `SVG / Programmatic` | `VALIDATED` |
| `obj_dropped_bottle` | `public/assets/objects/dropped_bottle.svg` | Object | `classroom_emergency` | Nour's dropped plastic water bottle | `48×48` | SVG | Alpha Transparent | Static post-blackout | `classroom_emergency.json` | `SVG / Programmatic` | `INTEGRATED` |
| `obj_emergency_lights` | `public/assets/objects/emergency_lights.svg` | Object | `classroom_emergency` | Ceiling emergency light strip & exit sign | `180×48` | SVG | Alpha Transparent | Subtle pulse | `classroom_emergency.json` | `SVG / Programmatic` | `VALIDATED` |
| `obj_door` | `public/assets/objects/door.svg` | Object | `classroom_*`, `door_closeup` | Acoustic steel classroom door | `180×360` | SVG | Alpha Transparent | Lock LED state swap | `door_closeup.json` | `SVG / Programmatic` | `INTEGRATED` |
| `obj_electronic_keypad` | `public/assets/objects/electronic_keypad.svg` | Object | `door_closeup`, `classroom_emergency` | Electronic keypad & crimson lock indicator | `96×140` | SVG | Alpha Transparent | Lock LED state swap | `door_closeup.json` | `SVG / Programmatic` | `INTEGRATED` |

---

## 4. UI Kit & Self-Hosted Fonts (DOM Overlay + SVG + Local WOFF2)

| Asset ID | Filename / Component | Category | Scene(s) | Intended Use | Dimensions | Format | Transparency | Animation | Dependencies | Production Method | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `ui_fonts_local` | `public/assets/fonts/*.woff2` (16 files) | Typography | Global DOM | Self-hosted `IBM Plex Sans Arabic`, `Cinzel`, `JetBrains Mono`, `Plus Jakarta Sans` (SIL OFL 1.1, see `NOTICE`) | Variable WOFF2 | WOFF2 | N/A | `font-display: swap` | `src/index.css` | `@fontsource` WOFF2 | `INTEGRATED` |
| `ui_title_lockup` | `public/assets/ui/title_lockup.svg` | UI | `main_menu` | Custom bilingual SVG lockup (`آخر جرس` / `THE LAST BELL`) | `520×160` | SVG | Alpha Transparent | Fade in | `ENVIRONMENT_AND_UI_SPEC.md` | `SVG / Programmatic` | `INTEGRATED` |
| `ui_dialogue_box` | DOM Component (`DialogueOverlay.tsx`) | UI | All dialogue scenes | RTL dialogue container with real portrait slot & nameplate | Responsive (`≤960×190`) | DOM + WebP | Translucent | `<=200ms` slide/fade | `DialogueSystem` | `DOM + WebP` | `INTEGRATED` |
| `ui_nameplate` | DOM Component (`DialogueOverlay.tsx`) | UI | All dialogue scenes | Speaker nameplate (`dir="rtl"`) | Responsive | CSS | Translucent | Instant swap | `DialogueSystem` | `DOM` | `INTEGRATED` |
| `ui_interact_prompt` | `public/assets/ui/interact_prompt.svg` | UI | `classroom_emergency` | Crisp floating interaction indicator (`[E] / تفقّد`) | `44×44` | SVG | Alpha Transparent | Gentle float | `InteractionSystem` | `SVG / Programmatic` | `INTEGRATED` |
| `ui_notebook_panel` | DOM Component (`NotebookModal.tsx`) | UI | `classroom_emergency` | Investigation Notebook modal (`Evidence / Clues / History`) | Responsive (`≤960×600`) | DOM + SVG | Translucent | `<=200ms` fade | `EvidenceSystem` | `DOM + SVG` | `INTEGRATED` |
| `ui_evidence_icons` | `public/assets/ui/icons/{ev_*,clue_note}.svg` (6 icons) | UI | Notebook & HUD | Crisp 64×64 vector icons for all 5 evidence items & clues | `64×64` | SVG | Alpha Transparent | Static | `evidence.json` | `SVG / Programmatic` | `INTEGRATED` |
| `ui_countdown_hud` | DOM Component (`HudOverlay.tsx`) | UI | Active gameplay | `59:59` `tabular-nums` timer + warning state labels | Responsive | CSS + Mono | Translucent | Pulse < 03:00 | `TimerManager` | `DOM` | `INTEGRATED` |
| `ui_puzzle_panel` | DOM Component (`PuzzleModal.tsx`) | UI | `puzzle_seating` | Puzzle 01 7-slot photo grid, clickable labels, chart ref | Responsive (`≤1080×620`) | DOM | Translucent | `<=200ms` slot snap | `PuzzleManager` | `DOM` | `INTEGRATED` |
| `ui_menus_buttons` | DOM Components | UI | `main_menu`, `pause`, `settings`, `chapter_card`, `ending` | Main menu, chapter cards, pause/settings, toast notifications | Responsive | CSS | Translucent | `<=200ms` fade | `SaveManager`, `AudioManager` | `DOM` | `INTEGRATED` |

---

## 5. Visual Effects (Effects)

| Asset ID | Filename / Implementation | Category | Scene(s) | Intended Use | Format | Animation | Dependencies | Production Method | Status |
|---|---|---|---|---|---|---|---|---|---|
| `fx_rain` | `src/effects/RainEffect.ts` | Effects | `academy_exterior`, `classroom_*` | Angled rain streaks & window droplets | Phaser Graphics / Particle | Continuous loop | `AudioManager` rain | `Programmatic Phaser FX` | `PLANNED` |
| `fx_flicker_blackout` | `src/effects/LightingEffects.ts` | Effects | `classroom_day`, `classroom_dark`, `classroom_emergency` | Power cut blackout + emergency flicker burst | Phaser Tween / Rectangle | Scripted beats | Scene transition | `Programmatic Phaser FX` | `PLANNED` |
| `fx_projector_glow` | `src/effects/LightingEffects.ts` | Effects | `classroom_dark`, `projector_closeup` | Volumetric cone polygon + floating dust motes | Phaser Graphics / Particle | Slow drift | `classroom_dark.json` | `Programmatic Phaser FX` | `PLANNED` |
| `fx_screen_transitions` | `src/effects/TransitionFX.ts` | Effects | All scenes | Crossfades & blackout cuts | Phaser Camera Fade | `350ms–1400ms` | Scene manager | `Programmatic Phaser FX` | `PLANNED` |
| `fx_interaction_highlight` | `src/effects/HighlightFX.ts` | Effects | `classroom_emergency` | Subtle cold-white hairline glow around hovered/proximate hotspot | Phaser Graphics / Tween | Hover / proximity | `InteractionSystem` | `Programmatic Phaser FX` | `PLANNED` |

---

## 6. Audio List (Chapter 01 — Procedural Web Audio Synthesis)

All audio assets below are cleanly synthesized via the Web Audio API inside `src/systems/AudioManager.ts` (zero external broken URLs, full Master/Music/SFX mixer and mute control, honestly labeled as `Procedural WebAudio` placeholders ready for optional `.ogg`/`.mp3` drop-in replacement later).

| Asset ID | Category | Scene(s) | Intended Use | Format | Loop | Production Method | Status |
|---|---|---|---|---|---|---|---|
| `sfx_rain_loop` | Ambience | `academy_exterior`, `classroom_*` | Filtered pink-noise rain pattering against glass | WebAudio Synth | Yes | `Procedural WebAudio` | `PLANNED` |
| `sfx_room_ambience` | Ambience | `classroom_emergency` | Low `60Hz/120Hz` electrical fluorescent emergency hum | WebAudio Synth | Yes | `Procedural WebAudio` | `PLANNED` |
| `sfx_clock_tick` | SFX | `classroom_day`, `classroom_emergency` | Subtle dry mechanical tick / low-time pulse | WebAudio Synth | Triggered | `Procedural WebAudio` | `PLANNED` |
| `sfx_school_bell` | SFX | `door_closeup` / `ending` | Resonant metallic dual-tone school bell ring | WebAudio Synth | One-shot | `Procedural WebAudio` | `PLANNED` |
| `sfx_ui_click` | UI SFX | All UI | Soft tactile click / hover chime | WebAudio Synth | One-shot | `Procedural WebAudio` | `PLANNED` |
| `sfx_ui_evidence` | UI SFX | `classroom_emergency`, `puzzle_seating` | Crisp confirmation chord on evidence collect / puzzle solve | WebAudio Synth | One-shot | `Procedural WebAudio` | `PLANNED` |
| `sfx_door_lock` | SFX | `door_closeup` | Electronic relay buzz (locked) / brief latch click (Karim exit) | WebAudio Synth | One-shot | `Procedural WebAudio` | `PLANNED` |
| `bgm_tension_underscore` | Music | `classroom_emergency`, `puzzle_seating` | Minimal dark-ambient minor drone & sparse piano/pad pulses | WebAudio Synth | Yes | `Procedural WebAudio` | `PLANNED` |
