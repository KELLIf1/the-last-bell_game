# Development Plan — THE LAST BELL (Chapter 01: The Locked Classroom)

---

## 1. Core Gameplay Loop (Chapter 01)

1. **Main Menu & Chapter Title:** Player launches from the atmospheric Main Menu (`New Game` / `Continue` / `Settings`).
2. **Opening Cinematic (Scene 01 → Scene 02a):** Exterior rainy dusk pan at Orion Academy → transition into Classroom 3B (`16:20`) with all 6 present students (`Samer`, `Layan`, `Yacine`, `Nour`, `Karim`, `Mariam`) → brief opening dialogue.
3. **Lockdown & Inciting Incident (Scene 02b):** Power blackout → red/amber emergency lighting engages → smart projector boots automatically → countdown `59:59` starts → Adam Mourad's broadcast & Elena Mourad's photograph appear → electronic door locks.
4. **Classroom Exploration & Evidence Gathering (Scene 03):** Player moves/clicks around the walkable classroom floor to examine **5 interactive objects**:
   - **Whiteboard (`board`)**: Sequence `4-1-7-2-6-3-5`, handwritten note, and 7 batch portraits/slots.
   - **Teacher's Desk (`teachers_desk`)**: Old seating chart (3 years ago) + old notebook margin clue.
   - **Wall Clock (`wall_clock`)**: Stopped at `16:20`, engraved `"Time remembers"`.
   - **Classroom Photograph (`class_photo`)**: Old group photo with one figure cut out.
   - **Attendance Register (`attendance_register`)**: Physically damaged/illegible removed entry (D2: name NOT revealed).
   - Collected evidence opens and persists in the **Investigation Notebook**.
5. **Puzzle 01: The Seating Order (Scene 04):** Unlocked via story flags once required clues (`board` + `teachers_desk` + `class_photo`) are examined. Player deduces the left-to-right seating order in the old class photograph by cross-referencing the old seating chart against `4-1-7-2-6-3-5` on the board (with one damaged/unknown slot per D2). Success reveals: `"ELENA WAS NOT ALONE THAT DAY."` (`لم تكن إيلينا وحدها في ذلك اليوم.`), plays the group reaction + Adam's follow-up, and logs the completion timestamp.
6. **Social Investigation — Five Conversations (Scene 05):** Player questions **Layan, Yacine, Nour, Mariam, and Karim**. Conditional dialogue reacts to collected evidence (e.g., showing the cut photograph triggers specific remarks from Layan and Nour) and timer state, updating relationship scores and unlocking 5 deep notebook clues.
7. **Timer, Consequence & Chapter Ending (Scenes 06–07):** Accelerated countdown with low-time tension and a story-consequence failure path (early disappearance/lost dialogue path if timer expires before solving, never a death). After Puzzle 01 and key conversations complete, the school PA sounds (`"NOT EVERYONE WHO DISAPPEARS IS LOST."`), lights flicker, Karim receives a message on his school tablet and exits when the door briefly opens, Adam delivers his closing line, and inspecting the projector reveals the cryptic teaser: `"ROOM 0 — PROJECT ECHO — ARCHIVE ACCESS DENIED."` followed by the school bell and `"TO BE CONTINUED — CHAPTER 02: THE FORGOTTEN ARCHIVE"`.

---

## 2. Characters (Chapter 01 Scope)

| ID | Name (AR / EN) | Role in Chapter 01 | Expressions Needed |
|---|---|---|---|
| `samer` | سامر / Samer | Player protagonist (17yo, observant) | 4 expressions (`neutral`, `worried`, `angry`, `sad`) + `speaking` state |
| `layan` | ليان / Layan | Analytical ally, notices anomalies (17yo) | 4 expressions + `speaking` state |
| `yacine` | ياسين / Yacine | Dominant, defensive, reacts to Elena (18yo) | 4 expressions + `speaking` state |
| `nour` | نور / Nour | Cheerful facade, drops bottle at Elena's photo (17yo) | 4 expressions + `speaking` state |
| `karim` | كريم / Karim | Tech-savvy, guarded, exits via tablet summons (17yo) | 4 expressions + `speaking` state |
| `mariam` | مريم / Mariam | Direct, assertive, past rift with Elena (18yo) | 4 expressions + `speaking` state |
| `adam` | آدم مراد / Adam Mourad | Former teacher, captor via broadcast (39yo) | Projector broadcast portrait(s) needed in Ch1 only |
| `elena` | إيلينا مراد / Elena Mourad | Deceased student (3 years ago) | Archival portrait / photograph silhouette needed in Ch1 only |

---

## 3. Scene List (Chapter 01)

| Scene ID | Narrative Role | Lighting State |
|---|---|---|
| `boot` / `preload` | Asset loading with graceful missing-asset warnings | Neutral dark |
| `main_menu` | Title screen (`New Game`, `Continue`, `Settings`) | Rainy dusk backdrop |
| `academy_exterior` | Scene 01: Slow approach, rain, warm classroom windows, title cards | Rainy twilight |
| `classroom_day` | Scene 02a: `16:20` pre-blackout classroom, opening dialogue | Overcast cold daylight + warm interior bulbs |
| `classroom_dark` | Scene 02b (transition): Sudden blackout moment | Pitch dark + projector beam |
| `classroom_emergency` | Scenes 02c, 03, 05, 06, 07: Main playable classroom hub | Cold emergency blue/slate + red warning accents |
| `projector_closeup` | Scene 02c / 07: Adam's message, countdown reveal, final Room 0 teaser | High-contrast projector glow |
| `door_closeup` | Scene 02c / 06 / 07: Electronic lock panel, Karim's brief door opening, ending pan | Cold corridor light + red/amber lock LED |
| `puzzle_seating` | Scene 04: Interactive Puzzle 01 overlay/scene (7 seats, 7 labels, chart reference) | Focused desk/projector illumination |
| `ending` | Scene 07 outro: School bell, black screen, Chapter 02 teaser card | Blackout |

---

## 4. Story Flags & Progression Schema (`StoryManager`)

| Flag Key | Type | Trigger & Effect |
|---|---|---|
| `ch1_intro_completed` | boolean | Set after Scene 01 exterior & opening Scene 02a dialogue |
| `ch1_blackout_triggered` | boolean | Set when power fails and emergency lights activate |
| `ch1_adam_broadcast_seen` | boolean | Set after Adam's opening projector speech & timer (`59:59`) starts |
| `ev_board_examined` | boolean | Board (`4-1-7-2-6-3-5` + note) inspected |
| `ev_desk_examined` | boolean | Teacher's desk (old seating chart + margin note) inspected |
| `ev_clock_examined` | boolean | Wall clock (`16:20` / `"Time remembers"`) inspected |
| `ev_photo_examined` | boolean | Cut classroom photograph collected |
| `ev_register_examined` | boolean | Damaged attendance register (illegible removed entry per D2) inspected |
| `puzzle_01_unlocked` | boolean | Auto-derived when `ev_board_examined && ev_desk_examined && ev_photo_examined` |
| `puzzle_01_attempts` | number | Tracks wrong submissions for progressive hint tiers |
| `puzzle_01_solved` | boolean | Set when Seating Order puzzle is solved |
| `puzzle_01_solved_at` | string | In-game timer timestamp when Puzzle 01 was solved |
| `puzzle_01_failed_timeout` | boolean | Set if countdown reaches `00:00` before Puzzle 01 is solved (D6 consequence path) |
| `talked_layan` / `talked_yacine` / `talked_nour` / `talked_mariam` / `talked_karim` | boolean | Tracks completion of each of the 5 conversations |
| `asked_nour_photo` | boolean | Tracks if Samer confronted Nour about the cut photograph |
| `clue_second_figure` | boolean | Unlocked via Layan conditional dialogue when photo was collected |
| `clue_yacine_avoids_elena` | boolean | Unlocked during Yacine's conversation |
| `clue_elena_personality` | boolean | Unlocked during Mariam's conversation |
| `clue_adam_elena_bond` | boolean | Unlocked during Layan/Mariam investigation |
| `clue_project_echo` | boolean | Unlocked during Karim's conversation |
| `rel_layan` / `rel_yacine` / `rel_nour` / `rel_mariam` / `rel_karim` | number | Relationship/trust scores adjusted by dialogue choices |
| `ch1_karim_summoned` | boolean | Set when Karim receives the tablet summons and exits (D4) |
| `ch1_room0_teaser_seen` | boolean | Set when final projector line (`ROOM 0 — PROJECT ECHO...`) is inspected |
| `ch1_completed` | boolean | Final Chapter 01 completion flag (unlocks Chapter 02 handoff) |

---

## 5. Core Reusable Systems (`src/systems/`)

1. **`StoryManager`**: Central flag store, condition evaluator (`allOf`, `anyOf`, `not`), relationship tracker, event emitter.
2. **`SceneAssembler`**: Reads `assets/config/scenes/[scene_id].json` and instantiates Phaser layers, props, character anchors (`origin` at feet), `depth` (`by_y`), walkable bounds, and interactive hitboxes.
3. **`TimerManager`**: Configurable accelerated 60-minute countdown, low-time warning thresholds, pause/resume support, timestamp formatting (`tabular-nums`), and timeout consequence hook.
4. **`DialogueSystem`**: Drives branching/conditional `dialogues.json` playback through the RTL DOM overlay, character portrait + expression + speaking state, and dialogue history logging.
5. **`EvidenceSystem`**: Manages `evidence.json` and unlocked clues, deduplicates collection, syncs with `StoryManager`, and powers the Investigation Notebook DOM panel.
6. **`PuzzleManager`**: Loads `puzzles.json`, validates seating cipher placements without hardcoded answers in UI code, provides tiered hints on failed attempts, and dispatches completion/consequence hooks.
7. **`InteractionSystem`**: Handles click/tap & keyboard proximity interaction inside the walkable area with unified hover/proximity prompts.
8. **`SaveManager`**: Serializes full state (scene, player coordinates, flags, relationships, evidence, dialogue history, timer remaining, timestamps) to `localStorage` with slot/continue support.
9. **`AudioManager`**: Web Audio / Phaser sound controller for rain, room ambience, ticking clock, school bell, UI feedback, and tension music with Master / Music / SFX volume sliders.

---

## 6. Asset Inventory Overview (Category Level — Detailed in Milestone 3)

- **Backgrounds (6):** `academy_exterior`, `classroom_day`, `classroom_dark`, `classroom_emergency`, `classroom_projector_closeup`, `classroom_door_closeup`.
- **Characters:** 6 present students (world sprites/full-body poses + portraits with 4 expressions + speaking state), plus Adam (broadcast portrait) and Elena (archival photo portrait).
- **Interactive & Environmental Objects:** Student desks/chairs (7-seat arrangement), whiteboard, ceiling/smart projector, teacher's desk, wall clock, rain-streaked windows, bookshelves, school bags/water bottle prop, handwritten note/papers, cut classroom photo, damaged attendance register, Karim's school tablet, emergency lights, electronic classroom door.
- **UI Kit (DOM + SVG):** RTL dialogue box, speaker nameplate, interaction indicator, investigation notebook modal, evidence & clue cards, countdown HUD, Puzzle 01 board/cards, main menu, chapter title card, pause/settings modals, toast notifications.
- **Effects & Audio:** Rain particle/overlay, light flicker, blackout fade, projector light cone, interaction highlight, rain loop, room drone, clock tick, school bell, UI clicks, subtle tension underscore.
