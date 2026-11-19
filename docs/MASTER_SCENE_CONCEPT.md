# Master Cinematic Art Direction & Scene Design Concept — THE LAST BELL (Chapter 01: The Locked Classroom)

## 1. Visual Language & Cohesive Palette
- **Academy Identity:** Orion International Academy (`أكاديمية أوريون الدولية`), rendered in semi-realistic stylized 2D adventure illustration with architectural depth and controlled atmospheric lighting.
- **Master Color Palette:**
  - Deep Shadows / Silhouettes: `#111827`
  - Ambient Classroom Shadows: `#182536`
  - Cool Structural Highlights: `#526477`
  - Muted Slate Trim & Glass Borders: `#303943`
  - Soft Overcast Daylight Accents: `#E9E4D8`
  - Academy Tie / Crimson Trim: `#743D49`
  - Warm Lamp / Upper Window Glow: `#D6A65D`
  - Emergency Lock Keypad Glow: `#C64B50`

## 2. Architectural Room Consistency (`Classroom 3B`)
All classroom shots (`classroom_day`, `classroom_emergency`, `classroom_dark`, `desk7_closeup`, `projector_closeup`, `door_closeup`) depict the exact same unified 3D-perspective room:
- **Front Wall:** Centered large digital interactive blackboard (`0.408–0.614`), analog wall clock frozen at `16:20` (`0.667, 0.317`), off-center wooden teacher's desk with ergonomic chair, open dark laptop, and neatly stacked seating/attendance documents (`0.578–0.746`).
- **Left Wall:** Three tall dark-metal framed classroom windows with floor-length sheer curtains, exterior storm rain streaks, distant faint city bokeh, and an indoor potted plant in the front-left corner.
- **Right Wall:** Framed corkboard notices, dual framed archival photographs (class group portrait + discreet portrait of Elena Mourad), low wooden bookshelf holding the damaged attendance ledger, academy crest emblem above the door, and the modern wood-and-steel entrance door with narrow frosted glass insert and red electronic keypad (`#C64B50`).
- **Floor:** Continuous dark oak herringbone hardwood (`y ≥ 0.61`) supporting unobstructed `by_y` depth sorting.

## 3. 3-Row, 7-Desk Furniture & Character Blocking
Desks (`desk_wooden.png`) and empty chairs (`chair_wooden.png`) are decoupled foreground sprites depth-sorted by `y` alongside characters (`origin: [0.5, 1.0]`), ensuring genuine lower-body desk occlusion for seated characters and realistic depth traversal for Samer:
- **Front Row (2 Desks, `y ≈ 0.715`):**
  - Left: **Layan** (`layan_seated.png`, `0.326, 0.684`) seated behind wooden desk writing notes, facing inward-right.
  - Right: **Yacine** (`yacine_seated.png`, `0.502, 0.696`) seated behind flipped desk (`flipX: true`) with crossed arms and defensive posture.
- **Middle Row (3 Desks, `y ≈ 0.808`):**
  - Left (by rainy windows): **Elena's Empty 7th Desk** (`0.228, 0.808`) with empty chair, worn notebook, and the cut group photograph (`ev_cut_photo` hotspot — launches Shot 06 `desk7_closeup` inspection).
  - Center: **Samer's Desk** (`0.468, 0.808`) with **Samer** (`samer_world.png`, `0.382, 0.822`) standing slightly left-forward ready for movement.
  - Right (near archival photo wall): **Mariam** (`mariam_seated.png`, `0.680, 0.800`) seated calmly, subtly turned right toward the archival wall and bookshelf.
- **Rear Row (2 Desks, `y ≈ 0.929`):**
  - Left: Empty rear-left desk (`0.306, 0.928`), while **Nour** (`nour_world.png`, `0.142, 0.848`) stands nervously beside the tall left windows near her dropped water bottle (`dropped_bottle`).
  - Right: **Karim** (`karim_seated.png`, `0.602, 0.912`) seated slightly hunched over his glowing cyan tablet (`hides when ch1_karim_summoned === true`).

## 4. Multi-Shot Scene Flow (8 Master Shots)
1. **Shot 01 — Exterior Establishing (`academy_exterior.png`):** 3-story rainy Orion Academy facade with warm illuminated second-floor classroom windows and wet pavement reflections.
2. **Shot 02 — Entrance (`academy_entrance.png`):** Closer framing on the glass double doors and stone steps before entering.
3. **Shot 03 — Classroom Calm 16:20 (`classroom_day.png`):** Overcast afternoon wait before blackout (`ch1_opening_classroom`).
4. **Shot 04 — Emergency Lockdown (`classroom_emergency.png`):** Storm window shadows across herringbone floor + crimson door lock glow `#C64B50` (primary investigation hub).
5. **Shot 05 — Blackout Projector Reveal (`classroom_dark.png`):** Ceiling lights off; crisp volumetric beam onto digital blackboard (`ch1_blackout_reaction`).
6. **Shot 06 — Elena's 7th Desk Close-Up (`classroom_desk7_closeup.png`):** Intimate frame on Seat 7's closed worn notebook, pencil, and cut vintage photograph.
7. **Shot 07 — Projector Screen Close-Up (`classroom_projector_closeup.png`):** Close view of the glowing digital blackboard projecting Adam Mourad's broadcast, Elena's archival portrait, and the `59:59` countdown.
8. **Door Close-Up (`classroom_door_closeup.png`):** Close view of the steel-and-wood door, frosted glass slit, and illuminated red keypad lock.
