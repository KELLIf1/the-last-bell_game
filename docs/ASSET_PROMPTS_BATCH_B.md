# Asset Production Prompts — Batch B: Characters & UI (Milestone 6)

All Batch B assets adhere strictly to `docs/CHARACTER_SPECS.md`, `docs/ART_DIRECTION_GUIDE.md`, and the Cinematic Visual Polish pass (consistent cel-noir shading, subtle cold top-left rim lighting, crisp `#090D16` linework, zero identity drift).

---

## 1. Full-Body In-Scene World Sprites (`public/assets/characters/world/{id}_world.png`)
- **Prompt A (Visual Generation):** Polished full-body 6-student lineup referencing `ref_characters_lineup_1794832133584.jpg` with Samer, Layan, Yacine, Nour, Karim, and Mariam in their exact Orion Academy navy-and-slate uniforms, preserved proportions/heights/accessories, elevated skin tones, realistic fabric folds, subtle cool top-left rim light, placed on a solid flat lavender (`#C4B5FD`) key backdrop with generous spacing.
- **Prompt B (Game-Ready Preparation):** Split per student slice, extract true RGBA alpha channel cleanly (`PNG32`, removing pure lavender key and isolated 1px fringe without touching white shirts or Karim's cyan tablet), trim, resize proportionally (`232×488>`), anchor bottom-center (`gravity south`) onto uniform `256×512` transparent sRGB PNG canvases (`origin: [0.5, 1.0]`).

---

## 2. Student Dialogue Portraits (`public/assets/characters/portraits/{id}/{neutral,worried,angry,sad,speaking}.png`)
- **Prompt A (Visual Generation):** Per-character single-identity reference (`{id}_head.png`) rendered into clean chest-up expression sheets against uniform dark slate (`#0F172A`) backgrounds with cool top-left rim lighting across 5 states (`neutral`, `worried`, `angry`, `sad`, `speaking`), keeping hairstyles, glasses, scarves, headphones, and blazer cuts 100% locked.
- **Prompt B (Game-Ready Preparation):** Crop inner panel margins (`pad = 16px` inside cell grid), center-crop and resize to exact `384×384` framed sRGB PNGs (`-strip`), inspect via composite contact sheet (`docs/previews/batch_b_portraits_contact.png`).

---

## 3. Adam Mourad & Elena Mourad Portraits
- **Adam Mourad (`adam/neutral.png`, `adam/intense.png`):** 39yo former philosophy/history teacher in tailored dark charcoal coat over black turtleneck, silver-streaked hair; `neutral` with cool broadcast rim light, `intense` with narrowed eyes and restrained crimson warning rim light.
- **Elena Mourad (`elena/archival.png`):** 17yo student from 3 years ago in Orion Academy blazer/tie and simple hairpin, rendered in warm faded archival sepia-slate photo finish.

---

## 4. UI Vector Kit (`public/assets/ui/`)
- `title_lockup.svg` (`520×160`): Bilingual `آخر جرس` / `THE LAST BELL` lockup with crimson accent rule.
- `interact_prompt.svg` (`44×44`): Crisp floating `[E]` examination indicator.
- `icons/*.svg` (`64×64`): 6 transparent vector icons (`ev_board`, `ev_chart`, `ev_clock`, `ev_photo`, `ev_register`, `clue_note`) matching `evidence.json`.
