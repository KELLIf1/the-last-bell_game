# Canon & Technical Decisions — THE LAST BELL (Chapter 01)

This document logs all narrative canon decisions, contradiction resolutions, and foundational technical decisions for **Chapter 01: The Locked Classroom**.

---

## 1. Mandatory Canon Decisions (D1–D6)

| ID | Issue in Source Document | Chapter 01 Decision | Rationale / Scope |
|---|---|---|---|
| **D1** | Story text mentions "seven students" remaining after class, while the character list defines six students. | **Six students are present** in the classroom: Samer (player), Layan, Yacine, Nour, Karim, and Mariam. The classroom contains **seven seats**; the seventh seat corresponds to the old class record (Elena Mourad's batch from three years ago), not a seventh living student in the room. | Preserves the "7 seats / 7 portraits" motif on the whiteboard and seating puzzle without inventing an unscripted 7th present student. |
| **D2** | The story document identifies the removed name in the attendance register as "Samer". | In Chapter 01, the attendance register shows only that **one entry was removed and is physically damaged/illegible**. The name itself is **not** revealed in Chapter 01; that reveal is deferred to Chapter 02+. | Maintains mystery pacing and prevents spoiling later-chapter twists about Samer's mother and transfer history. |
| **D3** | Number of character conversations. | **Five conversations**: Layan, Yacine, Nour, Mariam, and Karim (Samer is the player character). | Matches all acceptance criteria and keeps investigation scope crisp. |
| **D4** | Karim's disappearance at the end of Chapter 01 (story mentions "school phone" / "هاتفه المدرسي"). | Karim receives a summons message on his **school tablet** (`tablet`) and exits when the electronic classroom door briefly unlocks. **No violence or harm is shown.** | Unifies D4 ("school tablet") with the non-graphic psychological thriller tone. |
| **D5** | Mention of Room Zero (`الغرفة صفر`). | Appears **only** as a cryptic hidden line on the projector at the very end of Chapter 01 (`ROOM 0 — PROJECT ECHO — ARCHIVE ACCESS DENIED.`) with no explanation. | Serves strictly as a teaser bridging to Chapter 02+. |
| **D6** | Failure state when the countdown expires or puzzle fails repeatedly. | Timer expiry or puzzle failure triggers a **story consequence** (an early disappearance/lost opportunity and altered investigation path), **never a death scene or graphic fail screen**. | Respects the psychological mystery genre and Chapter 01 canon. |

---

## 2. Additional Source Contradictions Found & Resolved (C1–C4)

| ID | Observation in Source Document | Default Resolution Applied | Status |
|---|---|---|---|
| **C1** | Section 3 states an unnamed "supervising teacher" (`الأستاذ المشرف`) told the students to wait in the classroom until he returned, then the blackout happens and Adam takes over. | An unnamed supervising teacher excused himself shortly before `16:20` (leaving the academic project group waiting in Classroom 3B). When the power cuts, Adam Mourad hijacks the room remotely via the smart-board/projector and electronic lock system. | Open for user override in Milestone 0 review |
| **C2** | Section 4 lists "7 portraits on the board, an old notebook, an old seating chart, a cut group photo, and a paper with 7 coded numbers," while Milestone 8 defines 5 specific interactive hotspots (Board with `4-1-7-2-6-3-5` & note, Teacher's Desk with old seating chart, Wall Clock at `16:20`, Cut Classroom Photo, Damaged Attendance Register). | All items are unified cleanly across the **5 classroom hotspots** without dropping any story detail: the **Board** displays both the 7 coded slots/numbers (`4-1-7-2-6-3-5`) and the handwritten note; the **Teacher's Desk** holds the old seating chart and the old notebook/margin memo confirming the mapping; the **Wall Clock** reads `16:20` ("Time remembers"); the **Photograph** shows the cut section; the **Attendance Register** shows the damaged illegible entry (per D2). | Open for user override in Milestone 0 review |
| **C3** | Section 4 refers to Karim's "school phone" (`هاتفه المدرسي`), whereas Section 2.1 D4 specifies "school tablet". | Standardized to **school tablet** (`الجهاز اللوحي المدرسي`) across all art, props, and dialogue. | Aligned with D4 |
| **C4** | Section 3 starts at `16:20` ("daytime"), while Adam's projector message says "مساء الخير... أمامكم ليلة واحدة" ("Good evening... you have one night"). | Set during a **rainy late-autumn dusk (`16:20`)** under heavy storm clouds, so the exterior already feels dim and cold, transitioning naturally into blackout/night emergency lighting once power is cut. | Consistent with Art Direction |

---

## 3. Foundational Technical Decisions

| Area | Decision | Reason |
|---|---|---|
| **Engine & Shell** | Phaser 3 mounted inside the existing Vite + TypeScript + React shell (`<div id="phaser-container">` isolated from React HUD re-renders). | Satisfies Phaser 3 requirement while leveraging clean DOM overlay for Arabic RTL and Vite asset bundling. |
| **Arabic & RTL Text** | All dialogue, notebook entries, evidence cards, puzzle labels, menus, and notifications render in an HTML/CSS **DOM overlay** with `dir="rtl"` for Arabic primary text and clean English secondary text. Canvas text is restricted strictly to Latin-only numeric labels (e.g., `59:59` countdown or numeric overlays if needed). | Phaser WebGL/Canvas text does not reliably shape Arabic ligatures or handle bidirectional RTL punctuation. |
| **Data-Driven Architecture** | Story flags (`StoryManager`), scene layouts (`assets/config/scenes/*.json`), dialogues (`dialogues.json`), evidence (`evidence.json`), and puzzle data (`puzzles.json`) live strictly outside rendering code. | Enables Chapter 02+ expansion without rewriting core systems. |
| **Art & Image Pipeline** | Use `generate_image` for key raster art (backgrounds, portraits, key-art) paired with ImageMagick (`/usr/bin/convert`) / Python3 for cropping, resizing, transparency cleanup, and validation, and crisp SVG/programmatic assets where transparent cutout props or UI motifs require razor-sharp vector clarity—each honestly labeled in `ASSET_MANIFEST.md`. | Matches real tools verified in the environment. |
