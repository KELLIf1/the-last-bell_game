#!/usr/bin/env python3
"""
Builds Milestone 6 visual inspection previews:
1. docs/previews/batch_b_portraits_contact.png — All 33 Batch B portraits (6x5 students + Adam x2 + Elena x1)
2. docs/previews/batch_b_classroom_emergency.png — Real transparent world sprites placed onto polished classroom_emergency.png strictly by classroom_emergency.json
"""

import json
import os
import subprocess
import tempfile

W, H = 1280, 720


def build_portraits_contact() -> None:
    rows = [
        ("samer", ["neutral", "worried", "angry", "sad", "speaking"]),
        ("layan", ["neutral", "worried", "angry", "sad", "speaking"]),
        ("yacine", ["neutral", "worried", "angry", "sad", "speaking"]),
        ("nour", ["neutral", "worried", "angry", "sad", "speaking"]),
        ("karim", ["neutral", "worried", "angry", "sad", "speaking"]),
        ("mariam", ["neutral", "worried", "angry", "sad", "speaking"]),
        ("broadcast", ["adam/neutral", "adam/intense", "elena/archival"]),
    ]

    tiles = []
    cell = 150
    pad = 10
    cols = 5
    out_w = cols * (cell + pad) + pad
    out_h = len(rows) * (cell + pad) + pad

    cmd = ["convert", "-size", f"{out_w}x{out_h}", "xc:#080E1A"]
    for r_idx, (char_id, states) in enumerate(rows):
        for c_idx, st in enumerate(states):
            if "/" in st:
                path = f"public/assets/characters/portraits/{st}.png"
                label = st
            else:
                path = f"public/assets/characters/portraits/{char_id}/{st}.png"
                label = f"{char_id}/{st}"
            x = pad + c_idx * (cell + pad)
            y = pad + r_idx * (cell + pad)
            cmd.extend([
                "(", path, "-resize", f"{cell}x{cell}", ")",
                "-geometry", f"+{x}+{y}",
                "-composite",
            ])
            tiles.append(
                f"font '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf' font-size 10 fill #F8FAFC stroke #080E1A stroke-width 2 text {x+4},{y+14} '{label}'"
            )

    with tempfile.NamedTemporaryFile("w", suffix=".mvg", delete=False) as tf:
        tf.write("\n".join(tiles))
        mvg = tf.name
    cmd.extend(["-draw", f"@{mvg}", "docs/previews/batch_b_portraits_contact.png"])
    subprocess.run(cmd, check=True)
    os.remove(mvg)
    print("Built docs/previews/batch_b_portraits_contact.png")


def build_world_composite() -> None:
    with open("public/assets/config/scenes/classroom_emergency.json", "r", encoding="utf-8") as f:
        scene = json.load(f)

    cmd = ["convert", "public/assets/backgrounds/classroom_emergency.png"]
    chars = sorted(scene.get("characters", []), key=lambda c: c.get("y", 0.5))

    for ch in chars:
        cid = ch["id"]
        sprite = f"public/assets/characters/world/{cid}_world.png"
        if not os.path.exists(sprite):
            continue
        char_h = round(ch.get("normHeight", 0.31) * H)
        # Aspect ratio of 256x512 canvas is 0.5 -> width = round(char_h * 0.5)
        char_w = round(char_h * 0.5)
        px = round(ch["x"] * W - char_w / 2)
        py = round(ch["y"] * H - char_h)
        if ch.get("facing") == "left":
            cmd.extend(["(", sprite, "-flop", "-resize", f"x{char_h}", ")"])
        else:
            cmd.extend(["(", sprite, "-resize", f"x{char_h}", ")"])
        cmd.extend(["-geometry", f"+{px}+{py}", "-composite"])

    cmd.append("docs/previews/batch_b_classroom_emergency.png")
    subprocess.run(cmd, check=True)
    print("Built docs/previews/batch_b_classroom_emergency.png")


def main() -> None:
    os.makedirs("docs/previews", exist_ok=True)
    build_portraits_contact()
    build_world_composite()


if __name__ == "__main__":
    main()
