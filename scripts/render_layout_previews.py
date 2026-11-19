#!/usr/bin/env python3
"""
Generates 1280x720 schematic spatial layout preview PNGs directly from
public/assets/config/scenes/*.json using ImageMagick native MVG drawing,
ensuring 100% geometric synchronization between JSON configs and previews.
"""

import glob
import json
import os
import subprocess

W = 1280
H = 720
SCENES_DIR = "public/assets/config/scenes"
OUT_DIR = "docs/previews"
FONT_MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf"
FONT_SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def px(nx: float) -> float:
    return round(nx * W, 1)


def py(ny: float) -> float:
    return round(ny * H, 1)


def rect_from_obj(obj: dict) -> tuple[float, float, float, float]:
    w = obj["w"] * W
    h = obj["h"] * H
    ox, oy = obj.get("origin", [0.5, 0.5])
    x = obj["x"] * W - ox * w
    y = obj["y"] * H - oy * h
    return round(x, 1), round(y, 1), round(x + w, 1), round(y + h, 1)


def esc(text: str) -> str:
    return text.replace("\\", "\\\\").replace("'", "\\'")


def render_scene(scene_path: str) -> str:
    with open(scene_path, "r", encoding="utf-8") as f:
        s = json.load(f)

    sid = s["sceneId"]
    bg = s["lighting"]["ambientColor"]
    floor_y = py(s["floorLineY"])

    mvg = []

    # Subtle 10x10 coordinate grid
    mvg.append("stroke #33415555 stroke-width 1 fill none")
    for i in range(1, 10):
        gx = round(W * i / 10, 1)
        gy = round(H * i / 10, 1)
        mvg.append(f"line {gx},0 {gx},{H}")
        mvg.append(f"line 0,{gy} {W},{gy}")

    # Floor plane + ground horizon line
    mvg.append(f"fill #0F172A88 stroke none rectangle 0,{floor_y} {W},{H}")
    mvg.append(f"fill none stroke #38BDF8 stroke-width 2 stroke-dasharray 10 6 line 0,{floor_y} {W},{floor_y} stroke-dasharray none")
    mvg.append(f"font '{FONT_MONO}' font-size 13 fill #38BDF8 stroke none text 16,{floor_y - 8} 'GROUND / FLOOR LINE y={s['floorLineY']}'")

    # Walkable area polygon
    walk = s.get("walkableArea", [])
    if walk:
        pts = " ".join(f"{px(p['x'])},{py(p['y'])}" for p in walk)
        mvg.append(f"fill #10B98126 stroke #10B981 stroke-width 2 stroke-dasharray 6 4 polygon {pts} stroke-dasharray none")
        cx = round(sum(px(p["x"]) for p in walk) / len(walk), 1)
        cy = round(sum(py(p["y"]) for p in walk) / len(walk), 1)
        mvg.append(f"font '{FONT_MONO}' font-size 13 fill #6EE7B7 stroke none text {cx - 55},{cy} 'WALKABLE AREA'")

    # Objects & interaction zones
    for obj in s.get("objects", []):
        x1, y1, x2, y2 = rect_from_obj(obj)
        interactive = obj.get("interactive", False)
        stroke = "#F59E0B" if interactive else "#64748B"
        fill = "#33415599" if interactive else "#1E293B99"
        mvg.append(f"fill {fill} stroke {stroke} stroke-width 2 rectangle {x1},{y1} {x2},{y2}")

        if interactive and "interactionZone" in obj:
            iz = obj["interactionZone"]
            ix1, iy1 = px(iz["x"]), py(iz["y"])
            ix2, iy2 = round(ix1 + px(iz["w"]), 1), round(iy1 + py(iz["h"]), 1)
            mvg.append(f"fill none stroke #FBBF24 stroke-width 2 stroke-dasharray 5 3 rectangle {ix1},{iy1} {ix2},{iy2} stroke-dasharray none")

        cx = round((x1 + x2) / 2, 1)
        label = esc(f"{obj['id']} (d:{obj.get('depth', 0)})")
        mvg.append(f"font '{FONT_SANS}' font-size 11 fill #E2E8F0 stroke none text {round(x1 + 6, 1)},{round(y1 + 16, 1)} '{label}'")

    # Characters (origin [0.5, 1.0], sorted by y)
    chars = sorted(s.get("characters", []), key=lambda c: c["y"])
    for ch in chars:
        ch_h = round(ch.get("normHeight", 0.32) * H, 1)
        ch_w = round(ch_h * 0.34, 1)
        fx = px(ch["x"])
        fy = py(ch["y"])
        bx1 = round(fx - ch_w / 2, 1)
        by1 = round(fy - ch_h, 1)
        bx2 = round(fx + ch_w / 2, 1)
        by2 = fy
        col = "#38BDF8" if ch["id"] == "samer" else "#E2E8F0"

        mvg.append(f"fill #0F172ABB stroke {col} stroke-width 2 roundrectangle {bx1},{by1} {bx2},{by2} 6,6")
        # Head marker
        hy = round(by1 + ch_h * 0.14, 1)
        hr = round(ch_w * 0.28, 1)
        mvg.append(f"fill none stroke {col} stroke-width 2 circle {fx},{hy} {fx},{round(hy + hr, 1)}")
        # Feet anchor crosshair
        mvg.append(f"fill #EF4444 stroke none circle {fx},{fy} {fx},{round(fy + 5, 1)}")
        mvg.append(f"fill none stroke #EF4444 stroke-width 2 line {fx - 10},{fy} {fx + 10},{fy}")

        if ch.get("interactive") and "interactionZone" in ch:
            iz = ch["interactionZone"]
            ix1, iy1 = px(iz["x"]), py(iz["y"])
            ix2, iy2 = round(ix1 + px(iz["w"]), 1), round(iy1 + py(iz["h"]), 1)
            mvg.append(f"fill none stroke #FBBF24 stroke-width 1.5 stroke-dasharray 4 3 rectangle {ix1},{iy1} {ix2},{iy2} stroke-dasharray none")

        clabel = esc(f"{ch['id']} ({ch['x']},{ch['y']})")
        mvg.append(f"font '{FONT_MONO}' font-size 11 fill {col} stroke none text {round(bx1 - 12, 1)},{round(by1 - 6, 1)} '{clabel}'")

    # Lighting direction arrow
    ld = s.get("lighting", {}).get("direction")
    if ld:
        x1, y1, x2, y2 = px(ld["fromX"]), py(ld["fromY"]), px(ld["toX"]), py(ld["toY"])
        mvg.append(f"fill none stroke #FDE047 stroke-width 2 stroke-dasharray 8 5 line {x1},{y1} {x2},{y2} stroke-dasharray none")
        mvg.append(f"fill #FDE047 stroke none circle {x1},{y1} {x1},{round(y1 + 6, 1)}")

    # UI Safe Areas
    ui = s.get("uiSafeAreas", {})
    for key, box in ui.items():
        ux1, uy1 = px(box["x"]), py(box["y"])
        ux2, uy2 = round(ux1 + px(box["w"]), 1), round(uy1 + py(box["h"]), 1)
        is_dlg = "dialogue" in key.lower()
        ucol = "#DC2626" if is_dlg else "#60A5FA"
        ufill = "#DC262622" if is_dlg else "#60A5FA22"
        mvg.append(f"fill {ufill} stroke {ucol} stroke-width 2 stroke-dasharray 6 4 rectangle {ux1},{uy1} {ux2},{uy2} stroke-dasharray none")
        mvg.append(f"font '{FONT_MONO}' font-size 11 fill {ucol} stroke none text {round(ux1 + 8, 1)},{round(uy1 + 16, 1)} '{esc(key.upper())}'")

    # Header badge
    mvg.append("fill #080E1AE6 stroke #475569 stroke-width 1 roundrectangle 365,14 880,46 4,4")
    mvg.append(f"font '{FONT_MONO}' font-size 13 fill #F8FAFC stroke none text 385,35 'SCENE LAYOUT: {esc(sid)} (1280x720)'")

    mvg_path = os.path.join(OUT_DIR, f"layout_{sid}.mvg")
    png_path = os.path.join(OUT_DIR, f"layout_{sid}.png")
    with open(mvg_path, "w", encoding="utf-8") as f:
        f.write("\n".join(mvg))

    subprocess.run(
        ["convert", "-size", f"{W}x{H}", f"xc:{bg}", "-draw", f"@{mvg_path}", png_path],
        check=True,
    )
    os.remove(mvg_path)
    return png_path


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for leftover in glob.glob(os.path.join(OUT_DIR, "*.svg")):
        os.remove(leftover)
    paths = sorted(glob.glob(os.path.join(SCENES_DIR, "*.json")))
    for p in paths:
        out = render_scene(p)
        print(f"Rendered {out}")


if __name__ == "__main__":
    main()
