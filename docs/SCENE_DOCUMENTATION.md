# Scene Inventory & Spatial Documentation — THE LAST BELL (Chapter 01)

All scene layout data lives strictly outside rendering code under `public/assets/config/scenes/[scene_id].json` using normalized coordinates (`0.0–1.0` over a `1280 × 720` base frame), bottom-center character & desk anchors (`origin: [0.5, 1.0]`), and unified `by_y` depth sorting so Samer moves naturally in front of and behind all 7 desks while seated classmates remain naturally occluded by their wooden desks.

---

## 1. Scene Inventory (Chapter 01 — 9 Scene Configs)

| Scene ID | JSON File | Purpose | Lighting State | Characters | Interactive Objects / Hotspots |
|---|---|---|---|---|---|
| `academy_exterior` | `public/assets/config/scenes/academy_exterior.json` | Shot 01 establishing rain pan & Chapter 01 title card | `rainy_dusk` | None | Baked facade |
| `academy_entrance` | `public/assets/config/scenes/academy_entrance.json` | Shot 02 closer entrance glass doors & stone steps push | `rainy_twilight_entrance` | None | Baked entrance |
| `classroom_day` | `public/assets/config/scenes/classroom_day.json` | Shot 03 / Scene 02a `16:20` pre-blackout opening conversation | `overcast_day_1620` | Samer, Nour (standing) + Layan, Yacine, Mariam, Karim (seated) | 7 desks (3 rows), Seat 7 notebook+photo |
| `classroom_dark` | `public/assets/config/scenes/classroom_dark.json` | Shot 05 / Scene 02b power outage, volumetric projector cone & reaction | `blackout_projector_cone` | 6 students in low dusk silhouette lighting | 7 desks (3 rows), ceiling projector |
| `classroom_emergency` | `public/assets/config/scenes/classroom_emergency.json` | Shot 04 primary investigation & 5-conversation hub | `emergency_lockdown` | Samer, Nour (standing) + Layan, Yacine, Mariam, Karim* (seated) | `board`, `wall_clock`, `teachers_desk`, `class_photo` (on Seat 7), `attendance_register`, `door`, `projector` |
| `desk7_closeup` | `public/assets/config/scenes/desk7_closeup.json` | Shot 06 close-up of Elena's Seat 7 desk (notebook, pencil, cut photo) | `rainy_window_closeup` | None | `class_photo` (`ev_cut_photo`) |
| `projector_closeup` | `public/assets/config/scenes/projector_closeup.json` | Shot 07 / Scenes 02c & 07 Adam broadcast, `59:59`, Elena archival photo, Room 0 teaser | `projector_screen_focus` | Diegetic broadcast overlay (Adam/Elena) | `broadcast_message_slot` |
| `door_closeup` | `public/assets/config/scenes/door_closeup.json` | Electronic keypad check, Karim brief tablet exit (D4), closing bell | `door_lock_red_led` | Karim (Scene 06 exit beat only) | `door_panel`, `electronic_keypad` |
| `puzzle_seating` | `public/assets/config/scenes/puzzle_seating.json` | Scene 04 Puzzle 01 spatial workspace (7 seats, 7 labels, chart reference) | `focused_desk_lamp` | None (overlay workspace) | `photo_slots_row`, `name_labels_tray`, `confirm_controls` |

*\*Karim hides automatically in `classroom_emergency` once `ch1_karim_summoned === true`.*

---

## 2. Spatial Validation Rules Applied
1. **3-Row, 7-Desk Perspective & Occlusion:** Front row (`y ≈ 0.715`, 2 desks), Middle row (`y ≈ 0.808`, 3 desks including Elena's Seat 7 by the left windows and Samer's center desk), Rear row (`y ≈ 0.929`, 2 desks). Every desk uses `depthMode: "by_y"` (`depth ≈ Math.round(y * 720)`), sitting slightly forward (`+12..20px` Y) of its seated student (`layan_seated`, `yacine_seated`, `mariam_seated`, `karim_seated`) for authentic lower-body occlusion.
2. **Baked Architectural Hit Zones (`visualMode: "baked"`):** `board`, `wall_clock`, `teachers_desk`, `attendance_register` (bookshelf ledger), `door`, and `projector` align pixel-precisely over the master-illustrated walls without pasting flat boxes or overlapping SVGs.
3. **Walkable Floor Bounds:** `walkableArea` spans `x: 0.12–0.90, y: 0.65–0.90` across the dark herringbone aisles.
4. **Master Integrated Composite Previews:** Verified in `docs/previews/master_classroom_{day,emergency,dark}_integrated.png`.
