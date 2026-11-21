# Environment & UI Specifications — THE LAST BELL (Chapter 01)

Reference Boards:
- Classroom Lighting: `/docs/reference-art/ref_classroom_lighting_1794832130465.jpg`
- UI & Props Moodboard: `/docs/reference-art/ref_ui_evidence_mood_1794832130808.jpg`

---

## 1. Orion Academy — Architectural & Classroom Specification

### Exterior (`academy_exterior` — Scene 01)
- **Architecture:** Neo-classical stone & dark slate facade, arched iron entrance gate, tall multi-pane steel windows, wet dark courtyard paving reflecting warm amber light from a single lit second-floor room (Classroom 3B).
- **Atmosphere:** Heavy dusk rain at `16:20`, overcast dark blue sky (`#080E1A`), drifting mist, bare autumn trees framing the left/right edges.

### Classroom 3B (`classroom_day`, `classroom_dark`, `classroom_emergency`)
- **Spatial Zones:**
  - **Left Wall:** Two tall steel-framed rain-streaked windows letting in cold storm light (`day`) or dark rain reflections (`emergency`).
  - **Front/Back Wall (Center-Right):** Large smart whiteboard & pull-down screen (`board`), ceiling-mounted projector (`projector`), stopped analog wall clock (`wall_clock` at `16:20`) above, and the teacher's mahogany/slate desk (`teachers_desk`) below.
  - **Right Side:** Heavy acoustic classroom door (`door`) with modern electronic keypad/card lock (`red` LED in lockdown) and small frosted glass strip + emergency `EXIT` sign glow.
  - **Center Walkable Area:** **Seven student desks & chairs** arranged cleanly with clear walking aisles between rows (6 occupied/associated with the present group + the 7th empty desk representing Elena's old seat per Canon Decision D1).
  - **Perimeter Details:** Wooden bookshelves along back corner, school bags beside desks, fallen water bottle near Nour's area after Scene 02 reveal, cut photograph & damaged attendance register placed cleanly at inspectable stations.
- **Material Palette:** Dark waxed slate tile floor (`#0F172A`), matte charcoal-navy acoustic wall paneling (`#1E293B`), dark walnut/oak desk tops (`#2A221E` desaturated), brushed steel legs and door hardware (`#64748B`).

---

## 2. UI & HUD Specification (DOM Overlay + Arabic RTL)

All text-bearing UI is rendered in an isolated HTML/CSS DOM overlay above the Phaser canvas (`pointer-events: none` on outer shell, `pointer-events: auto` on interactive panels) so Arabic shaping and `dir="rtl"` work natively.

### A. HUD Perimeter (Low Occlusion — ≥ 85% Playfield Clear)
- **Top-Left (`dir="ltr"` for numeric clarity):**
  - Countdown Timer (`59:59`) in `JetBrains Mono` `tabular-nums`, cold white (`#E2E8F0`) shifting to amber (`#D97706` < 10:00) and crimson (`#DC2626` < 03:00) paired with explicit text status (`الوقت المتبقي` / `TIME REMAINING` — never hue-only).
  - Subtle Mute/Audio toggle & Pause button (`>= 40px` touch target).
- **Top-Right (`dir="rtl"`):**
  - Current Objective single-line banner (e.g., `المهمة الحالية: تفقّد الفصل` / `Investigate the classroom`) + **Notebook (`دفتر التحقيق`)** button with collected evidence count (`tabular-nums`, e.g., `3 / 5`).

### B. Dialogue Panel & Nameplate (`dir="rtl"`)
- Anchored bottom center (`max-width: 960px`, height `160px–190px`).
- Surface: `#0B1220` at `94%` opacity, `1px solid rgba(226, 232, 240, 0.18)`, clean `4px` corner radius (single elevation, no nested bordered cards, no `border-l-4` stripes).
- **Portrait Slot (Right edge for RTL):** `128×128px` framed character portrait reacting to active `expression` and `speaking` state.
- **Nameplate:** Clean crisp title bar docked flush on top-right edge (`ليان — Layan`)—no pill chips.
- **Text Body:** Arabic primary dialogue (`17px–18px`, line-height `1.65`, `#F1F5F9`), optional secondary English translation line directly below (`13px`, `#94A3B8`) so bilingual clarity never clutters.
- **Dialogue Choices:** Clean full-width rectangular buttons (`min-height: 44px`), subtle slate hover fill (`#1E293B`), hairline border, keyboard selectable (`1–3` or click).

### C. Investigation Notebook (`دفتر التحقيق`)
- Clean 2-column dossier modal (`Evidence الأدلة` | `Clues & Notes الاستنتاجات` | `Dialogue Log سجل الحوارات` tabs).
- Left/Right split: clean item list (`min-height: 44px` rows) + selected evidence inspection card showing icon/image, discovery location, Arabic description, English summary, and linked characters.
- No pill tags or fake score badges; metadata uses subtle `·` typographic separators.

### D. Puzzle 01 Panel (The Seating Order)
- Centered dark-slate architectural overlay:
  - **Top/Side Reference Panel:** Old Seating Chart (seats `1–7` from 3 years ago, with one damaged illegible entry per D2) + Board Cipher (`4 - 1 - 7 - 2 - 6 - 3 - 5`).
  - **Main Workspace:** Seven numbered photograph slots (`Left → Right`), seven draggable/clickable name labels (`>= 44px` target height) supporting both drag-and-drop AND click-to-assign accessibility.
  - **Controls:** Clear `تأكيد الترتيب / Confirm Order` primary button, `إعادة ضبط / Reset`, and progressive hint box after wrong attempts.

### E. Menus & Chapter Title Cards
- **Main Menu:** Atmospheric live rainy academy backdrop (`academy_exterior`) with 35% quiet negative space on the right/center, custom SVG title lockup (`آخر جرس` / `THE LAST BELL`), three clean actions (`لعبة جديدة / New Game`, `متابعة / Continue`, `الإعدادات / Settings`), and a single flat control-hint footer line (`انقر للاستكشاف · E أو نقر للتفاعل · N دفتر التحقيق · Esc إيقاف مؤقت`).
- **Chapter Title Card:** Minimal full-bleed fade (`THE LAST BELL` → `CHAPTER 01 — THE LOCKED CLASSROOM / الفصل الأول: الفصل المغلق`).
