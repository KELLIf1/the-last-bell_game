# Art Direction Guide — THE LAST BELL (Chapter 01: The Locked Classroom)

**Style Classification:** Atmospheric 2.5D Cel-Noir Mystery Thriller  
**Base Resolution:** `1280 × 720` (16:9 widescreen, responsive scale-fit)  
**Visual Reference Boards (Milestone 1):**
- Classroom Lighting States: `/src/assets/images/ref_classroom_lighting_1794832130465.jpg`
- Student Character Lineup: `/src/assets/images/ref_characters_lineup_1794832133584.jpg`
- Props & UI Language Moodboard: `/src/assets/images/ref_ui_evidence_mood_1794832130808.jpg`

---

## 1. Overall Visual Style & Line/Shape Language

- **Illustration Style:** Semi-realistic 2D illustrated thriller with crisp, consistent ink outlines (`#090D16`, `1.5px–2.5px` equivalent weight on characters, subtle architectural edge lines on backgrounds) and soft cel-shaded value planes.
- **Anti-Cliché Restraint:** No glossy 3D plastic shading, no neon cyberpunk cyan/magenta glows, no exaggerated anime slapstick proportions, no gratuitous gore or horror clichés. Tension is grounded, claustrophobic, and psychological.
- **Environmental Storytelling:** Every object in Classroom 3B feels lived-in and slightly worn beneath Orion Academy's prestigious facade—rain streaks on tall steel-framed windows, scuff marks under oak desks, a stopped analog wall clock (`16:20`), and cold fluorescent reflections on waxed floors.

---

## 2. Color Palette & 60-30-10 Discipline

| Role | Color Name | Hex | Usage |
|---|---|---|---|
| **60% Dominant Canvas** | Midnight Navy | `#080E1A` | Exterior night sky, blackout shadows, HUD backdrop |
| **60% Dominant Canvas** | Deep Academy Blue | `#0F172A` | Classroom walls in emergency state, UI panels |
| **30% Structural Surfaces** | Slate Charcoal | `#1E293B` | Desks, window mullions, structural UI cards |
| **30% Structural Surfaces** | Steel Slate | `#334155` | Uniform trousers/skirts, hairline borders, secondary panels |
| **30% Structural Surfaces** | Cold Fog Gray | `#94A3B8` | Rain mist, muted metadata, inactive labels |
| **Text / Highlights** | Cold White | `#E2E8F0` | Arabic primary dialogue text, projector beam highlights, paper cues |
| **10% Focal & Warning** | Emergency Crimson | `#DC2626` | Countdown timer alerts, electronic door lock LED, emergency strip bounce, Adam warning cues |
| **10% Secondary Warmth** | Dust Amber | `#D97706` | Pre-blackout exterior window warmth (`16:20`), subtle analog clock brass/paper tint |
| **Uniform Accent** | Academy Burgundy | `#7F1D1D` | Striped ties, Orion Academy crest trim |

---

## 3. Lighting Rules & Three Mood States

1. **State A — Overcast Dusk (`classroom_day` / `academy_exterior`, `16:20`):**
   - Directional cold steel-blue skylight (`#64748B` → `#94A3B8`) pouring from the tall left windows across the desks.
   - Subtle muted warm interior ceiling fluorescents (`#FEF3C7` at low intensity) before power cuts.
   - Heavy rain streaks and condensation on exterior glass.
2. **State B — Sudden Blackout (`classroom_dark`):**
   - Instant drop to `#04070D` ambient darkness for dramatic pacing.
   - Single hard volumetric white-blue projector cone originating top-right/center toward the front screen, catching floating dust motes.
3. **State C — Emergency Lockdown (`classroom_emergency`):**
   - Cool emergency ceiling strip (`#38BDF8` desaturated icy blue-white at ~35% output) casting top-down pools on the central desks.
   - Deep crimson bounce light (`#DC2626` at ~18% opacity) along the electronic door lock panel and baseboard corners.
   - Characters standing inside the room carry cool top-left rim highlights and dark slate core shadows so they sit naturally on the floor plane without looking pasted on.

---

## 4. Perspective, Camera, & Character Proportions

- **Perspective:** Side-angled 2.5D three-quarter eye-level perspective (`horizon line ≈ 0.56` of viewport height). Floor plane recedes gently toward the front-right whiteboard/door wall, giving a clear walkable lane and unobstructed sightlines to all 5 interactive hotspots.
- **Character Proportions:** Grounded teenage/adult anatomical ratios (~6.8 to 7.2 heads tall for 17–18yo students; ~7.5 heads tall for Adam Mourad).
- **Anchoring & Depth:** All in-scene characters use **bottom-center (feet) origin** (`origin: [0.5, 1.0]`) and dynamic `depth` sorted by `y` coordinate (`by_y`), ensuring natural overlap with desks and peers.
- **Portraits vs. World Sprites:** Dialogue portraits are chest-up (`3:4` or `1:1` framing) with clear facial plane changes across `neutral`, `worried`, `angry`, `sad`, plus a subtle mouth/outline `speaking` highlight state.

---

## 5. Typography, Dialogue Presentation & VFX

- **Font Pairing (2+1 Rule):**
  - **Arabic Primary (`dir="rtl"`):** `IBM Plex Sans Arabic` (clean, legible editorial weights `400` and `600`, zero ornamental clutter).
  - **English Secondary / Title Display:** `Cinzel` for chapter titles & locks (`THE LAST BELL`) paired with `Plus Jakarta Sans` for UI labels.
  - **Numeric / Countdown / Evidence Codes:** `JetBrains Mono` with `font-variant-numeric: tabular-nums` (`59:59`, `16:20`, `4-1-7-2-6-3-5`).
- **Dialogue Presentation:**
  - Anchored at the bottom safe zone (`height ≤ 24%` of viewport), leaving ≥ 75–85% of the classroom unobstructed.
  - Dark translucent slate glass (`rgba(11, 18, 32, 0.92)`), `1px` cold-white hairline border (`rgba(226, 232, 240, 0.16)`), NO `backdrop-filter` blur over the active Phaser canvas, NO pill badges.
  - Speaker portrait docks on the **right** side for Arabic RTL flow (`dir="rtl"`), with crisp nameplate and subtle English sub-caption when enabled.
- **Visual Effects (VFX):**
  - **Rain:** Angled translucent diagonal rain streaks + window pane drip overlay.
  - **Light Flicker:** Non-rhythmic 2–4 frame opacity dip + subtle crimson flash prior to Karim's disappearance.
  - **Projector Beam & Scanlines:** Subtle 2% opacity horizontal scanline + soft dust particles in projector cone.
  - **Interaction Highlight:** Soft cold-white/amber hairline outline + subtle floating icon above hovered/nearby hotspot (never garish neon boxes).
