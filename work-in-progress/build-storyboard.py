import html
import json
import re
import sys
from pathlib import Path

MARKER = "<!-- build:slides -->"

if len(sys.argv) != 4:
    sys.exit("usage: python3 build-storyboard.py <pres.html> <talk.json> <out.html>")

deck_path, talk_path, out_path = sys.argv[1:4]
deck = Path(deck_path).read_text()
talk = json.loads(Path(talk_path).read_text())
template = (Path(__file__).parent / "storyboard.html").read_text()

if template.count(MARKER) != 1:
    sys.exit(f"storyboard.html must contain exactly one {MARKER}")

renders = [
    (m.group(1), m.group(0))
    for m in re.finditer(r'<section id="([^"]+)".*?</section>', deck, re.S)
]

templates = "\n".join(
    f'<template data-slide="{html.escape(sid, quote=True)}">{markup}</template>' for sid, markup in renders
)
fallback = json.dumps(talk, ensure_ascii=False).replace("<", "\\u003c")
injected = f'{templates}\n<script type="application/json" id="fallback">{fallback}</script>'

Path(out_path).write_text(template.replace(MARKER, injected))
print(f"{len(renders)} slide renders embedded")
