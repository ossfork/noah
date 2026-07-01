#!/usr/bin/env python
"""Canonical generator for the Noah brand mark (OSS monochrome identity).

This is the SINGLE SOURCE OF TRUTH for the icon geometry. To change the
mark — even by a pixel of stroke width — edit the parameters in PARAMS
below and re-run:

    ~/.claude-python/bin/python brand/build.py
    bash brand/sync.sh

That regenerates both SVG sources (bare + plated) and propagates them
to every surface (website favicon, in-page logo, desktop icon variants).

The mark is a WRENCH (Lucide "wrench" glyph) — the open-source "Noah for
Tinkerers" identity. Strictly black-and-white: a near-white wrench on a
near-black rounded tile (the app icon), or a bare wrench glyph on
transparent. No ring, no aurora, no color. Red and amber stay reserved
for in-app safety semantics only — they never appear in the mark.

Why this exists: we kept ending up with four different "Noah" marks
across surfaces because the geometry was duplicated as inline CSS, as
hand-written SVG paths, and as platform-specific raster icons. From
this point forward, only this script writes the SVG, only sync.sh
copies it outward, and no surface hand-codes the glyph.
"""
from __future__ import annotations

import pathlib


# ── Brand parameters. Edit here and re-run to update everywhere. ───
# Canvas is 128 units. The Lucide "wrench" path is authored on a 24-unit
# grid; we translate+scale it to sit centered on the canvas.
PARAMS = {
    "glyph_scale": 3.072,      # 24·3.072 = 73.7 units → glyph fills ~58% of canvas
    "glyph_translate": 26.88,  # (128 − 73.7) / 2, centered on both axes
    "stroke": 2.0,             # in glyph units → 6.14 effective (~4.8% of canvas)
    "plate_corner_radius": 29,  # 23% of 128 — rounded-square app tile
}

# Monochrome palette. Near-black tile, near-white glyph. That is the
# whole system — there is no second brand color.
PLATE_TOP = "#171719"     # near-black, top of the tile gradient
PLATE_BOTTOM = "#0e0e10"  # a touch darker at the bottom
GLYPH_COLOR = "#fafafa"   # near-white wrench

# Lucide "wrench" path, authored on a 24×24 grid.
WRENCH_PATH = (
    "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77"
    "a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91"
    "a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
)


def _glyph(p, stroke_color: str) -> str:
    """The wrench glyph, translated + scaled to sit centered on the canvas."""
    t = p["glyph_translate"]
    s = p["glyph_scale"]
    sw = p["stroke"]
    return (
        f'  <g transform="translate({t:.2f} {t:.2f}) scale({s})" '
        f'fill="none" stroke="{stroke_color}" stroke-width="{sw}" '
        f'stroke-linecap="round" stroke-linejoin="round">\n'
        f'    <path d="{WRENCH_PATH}"/>\n'
        f"  </g>"
    )


def build_bare(p) -> str:
    """Bare wrench glyph on a transparent canvas (near-white stroke).

    Feeds the Android adaptive-icon foreground (composited over a dark
    background layer) and any surface that supplies its own backdrop.
    """
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="Noah">
  <title>Noah</title>
{_glyph(p, GLYPH_COLOR)}
</svg>
"""


def build_plated(p) -> str:
    """Wrench on a rounded near-black tile — the app icon. Self-contained,
    so it reads on any background (dock, taskbar, splash, in-app header),
    in both light and dark themes.
    """
    rx = p["plate_corner_radius"]
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="Noah">
  <title>Noah</title>
  <defs>
    <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{PLATE_TOP}"/>
      <stop offset="1" stop-color="{PLATE_BOTTOM}"/>
    </linearGradient>
    <clipPath id="tile"><rect width="128" height="128" rx="{rx}"/></clipPath>
  </defs>
  <g clip-path="url(#tile)">
    <rect width="128" height="128" fill="url(#plate)"/>
{_glyph(p, GLYPH_COLOR)}
  </g>
</svg>
"""


if __name__ == "__main__":
    here = pathlib.Path(__file__).parent
    (here / "noah-icon.svg").write_text(build_bare(PARAMS))
    (here / "noah-icon-plated.svg").write_text(build_plated(PARAMS))
    print(f"wrote {here}/noah-icon.svg")
    print(f"wrote {here}/noah-icon-plated.svg")
