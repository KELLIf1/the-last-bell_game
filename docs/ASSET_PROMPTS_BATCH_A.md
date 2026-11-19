# Asset Production Prompts — Batch A: Environments & Objects (Milestone 5)

Every asset in Batch A follows `docs/ART_DIRECTION_GUIDE.md` and `docs/ENVIRONMENT_AND_UI_SPEC.md`, documenting both **Prompt A (Visual Generation)** and **Prompt B (Game-Ready Preparation)**.

---

## 1. Environments / Backgrounds (AI-Raster + ImageMagick Processed)

### `bg_academy_exterior` (`public/assets/backgrounds/academy_exterior.png`)
- **Prompt A (Visual Generation):** `2D stylized cel-noir mystery game background of Orion Academy exterior at rainy twilight 16:20. Neo-classical dark stone private school facade viewed across a wet courtyard with wrought iron gate and bare autumn trees framing left and right. Heavy diagonal rain, moody dark blue storm sky (#080E1A), one second-floor classroom window glowing warm amber (#D97706) in the upper right-center. Semi-realistic 2D illustrated thriller art, clean shapes, atmospheric depth, no people, no text, no captions, no watermarks. Aspect ratio 16:9.`
- **Prompt B (Game-Ready Preparation):** Crop/scale center-weighted from `1376×768` to exact `1280×720` (`-resize 1280x720^ -gravity center -extent 1280x720 -strip`), save as sRGB PNG, verify zero border artifacts.

### `bg_classroom_day` (`public/assets/backgrounds/classroom_day.png`)
- **Prompt A:** `2D stylized cel-noir mystery game background of an empty private academy classroom at rainy dusk 16:20. Three-quarter side-angled eye-level view with floor horizon line at 56 percent height. Tall rain-streaked steel-framed windows along the left wall casting cold overcast blue-gray daylight across waxed dark slate floor tiles, clean matte charcoal-navy back wall with space in center for whiteboard and right wall space for a door, recessed ceiling lights dimly on. Muted desaturated slate and navy palette (#1E293B, #334155, #94A3B8). No characters, no foreground clutter in center floor, no text, no captions, no watermarks. Aspect ratio 16:9.`
- **Prompt B:** Resize/extent to exact `1280×720` opaque sRGB PNG (`-strip`), verify floor horizon alignment near `y=0.56`.

### `bg_classroom_dark` (`public/assets/backgrounds/classroom_dark.png`)
- **Prompt A:** `2D stylized cel-noir mystery game background of the exact same private academy classroom during a sudden power blackout at night. Pitch dark interior (#04070D), tall left windows showing storm night outside, single dramatic volumetric cold white-blue projector light cone angling downward from top center ceiling onto the center-back wall, faint floating dust motes in the beam. Semi-realistic 2D thriller illustration, clean atmospheric shadows, no characters, no text, no captions, no watermarks. Aspect ratio 16:9.`
- **Prompt B:** Resize/extent to exact `1280×720` opaque sRGB PNG (`-strip`), verify strong contrast inside projector cone.

### `bg_classroom_emergency` (`public/assets/backgrounds/classroom_emergency.png`)
- **Prompt A:** `2D stylized cel-noir mystery game background of an empty private academy classroom under emergency lockdown lighting at night. Three-quarter eye-level perspective with floor horizon line at 56 percent height. Deep midnight blue walls (#0B1220), waxed dark slate floor tiles reflecting cold icy-blue ceiling emergency light strip in center, subtle crimson emergency red bounce glow along the far right doorframe edge (#DC2626), dark rain-streaked tall windows on the left wall. Open clean center floor aisle for character placement. No characters, no text, no captions, no watermarks. Aspect ratio 16:9.`
- **Prompt B:** Resize/extent to exact `1280×720` opaque sRGB PNG (`-strip`), verify open center floor aisle matches `walkableArea` in `classroom_emergency.json`.

### `bg_projector_closeup` (`public/assets/backgrounds/classroom_projector_closeup.png`)
- **Prompt A:** `2D stylized cel-noir mystery game close-up background of a large pull-down classroom projection screen mounted on a dark navy matte wall in a darkened room. Soft cold white-blue screen glow illuminating the surrounding slate wall frame, subtle horizontal projection scanline texture, dark room corners, atmospheric dust motes. Clean empty projection canvas area ready for UI overlay, no characters, no readable text, no watermarks. Aspect ratio 16:9.`
- **Prompt B:** Resize/extent to exact `1280×720` opaque sRGB PNG (`-strip`), verify clean projection surface inside `0.17..0.83` horizontal zone.

### `bg_door_closeup` (`public/assets/backgrounds/classroom_door_closeup.png`)
- **Prompt A:** `2D stylized cel-noir mystery game close-up background of a heavy acoustic dark steel classroom door frame and surrounding dark slate-navy wall at night. Subtle crimson emergency light reflection from the right wall edge, frosted narrow vertical door glass showing faint cold hallway blue light beyond, clean floor line at 74 percent height. Semi-realistic 2D thriller illustration, no people, no text, no captions, no watermarks. Aspect ratio 16:9.`
- **Prompt B:** Resize/extent to exact `1280×720` opaque sRGB PNG (`-strip`), verify floor line aligns near `y=0.74`.

---

## 2. Interactive & Environmental Objects (Transparent Clean SVG Assets)

All 16 separate props in `public/assets/objects/*.svg` were authored as clean alpha-transparent vector illustrations rather than cropped raster images to guarantee zero edge haloing against dark emergency backgrounds while preserving identical `#090D16` cel-noir line weights and palette discipline:

- **Prompt A (Visual Design Spec):** Cel-noir 2D prop with crisp `#090D16` outline, `#1E293B` / `#334155` / `#2A221E` desaturated surface tones, `#E2E8F0` paper/whiteboard highlights, and `#DC2626` warning accents (`board.svg` with 7 cohort cards + `4-1-7-2-6-3-5`, `wall_clock.svg` frozen at `16:20`, `teachers_desk.svg`, `class_photo.svg` on 7th desk, `attendance_register.svg` with damaged entry per D2, `door.svg`, `electronic_keypad.svg`, `projector.svg`, `dropped_bottle.svg`, `desk_student.svg`, `chair_student.svg`, `bookshelves.svg`, `school_bags.svg`, `papers_notes.svg`, `school_tablet.svg`, `emergency_lights.svg`).
- **Prompt B (Game-Ready Preparation):** Explicit `viewBox`, zero opaque backdrop rect, clean alpha transparency outside silhouette, exact aspect ratio matching `public/assets/config/scenes/*.json` object bounds.
