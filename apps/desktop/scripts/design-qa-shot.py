#!/usr/bin/env python3
"""Headless design-QA screenshotter for the Noah desktop renderer.

Renders the real React components + the real `index.css` in headless Chromium —
NO Tauri — so you can eyeball the design system (type scale, primitives, all
diagnosis shapes) in dark AND light without building the native app.

It drives the dev-only harness at `apps/desktop/qa.html` (rendered by
`src/qa.tsx`), which tags each block with a `data-qa="<id>"` attribute. This
script auto-discovers those blocks and captures one full-resolution PNG per
block per theme — small, legible images instead of one 10k-px-tall page.

USAGE
  # 1. start the renderer dev server (separate shell), then:
  cd apps/desktop && pnpm exec vite --port 1420
  # 2. shoot:
  ~/.claude-python/bin/python apps/desktop/scripts/design-qa-shot.py
  #    options: --url, --out, --themes dark,light

SETUP (once)
  ~/.claude-python/bin/pip install playwright
  ~/.claude-python/bin/python -m playwright install chromium

Output: <out>/qa_<theme>_<section>.png  (default out: /tmp/noah-qa)
Reports any console/page errors per theme — a clean run prints `errors: []`.
"""
import argparse
import os
from playwright.sync_api import sync_playwright


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:1420/qa.html")
    ap.add_argument("--out", default="/tmp/noah-qa")
    ap.add_argument("--themes", default="dark,light")
    ap.add_argument("--width", type=int, default=820)
    ap.add_argument("--scale", type=int, default=2)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    themes = [t.strip() for t in args.themes.split(",") if t.strip()]

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for theme in themes:
            page = browser.new_page(
                viewport={"width": args.width, "height": 1000},
                device_scale_factor=args.scale,
            )
            errs: list[str] = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            page.on(
                "console",
                lambda m: errs.append(f"console.error: {m.text}")
                if m.type == "error"
                else None,
            )
            page.goto(f"{args.url}?theme={theme}", wait_until="networkidle")
            page.wait_for_timeout(1000)  # let webfonts settle
            sections = page.eval_on_selector_all(
                "[data-qa]", "els => els.map(e => e.getAttribute('data-qa'))"
            )
            for sec in sections:
                el = page.query_selector(f'[data-qa="{sec}"]')
                if el:
                    el.screenshot(path=os.path.join(args.out, f"qa_{theme}_{sec}.png"))
            print(f"[{theme}] {len(sections)} sections -> {args.out}; errors: {errs[:5]}")
            page.close()
        browser.close()
    print("DONE")


if __name__ == "__main__":
    main()
