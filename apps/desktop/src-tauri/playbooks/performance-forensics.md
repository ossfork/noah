---
name: performance-forensics
description: Diagnose slowness, high CPU, memory pressure, and hangs
platform: macos
last_reviewed: 2026-06-08
author: noah-team
source: bundled
emoji: ⚡
---

# Performance Forensics

## When to activate
User reports: computer is slow, fans are loud, spinning beach ball, apps freezing, system lagging, "everything takes forever."

## The iron rule: close the loop, never hand off a chore
Every path below ends with **Noah taking the action (with the user's OK) and
then verifying the result** — not with "now you go close some tabs." A user
who came to Noah because their Mac is slow should not be handed homework.

- ✅ "I'll quit Safari and Chrome to free that 2 GB — ready?" → do it → re-measure → report freed RAM.
- ❌ "Try closing some Safari tabs and let me know."

If an action genuinely requires the user (e.g. a doc with unsaved changes),
say *specifically* what and why, then **verify after** they confirm — never
leave the session dangling on a `WAIT_FOR_USER` with no follow-up.

## Quick check
Run `mac_system_info` and `mac_process_list` together. Classify into exactly
one of four diagnoses: **runaway process**, **memory pressure**, **disk full**,
or **nothing obvious → restart**.

## The diagnoses (try in order)

### D1 — Runaway process (most common)
One app pinning the CPU. Look at top CPU consumers in `mac_process_list`.
- If one app is using >100% CPU and it isn't a protected system process (see
  Caveats) → offer to force-quit it with `mac_kill_process`.
- **Close the loop:** after quitting, re-run `mac_process_list`, confirm CPU
  dropped, and report it in a `ui_done` ("Quit Acrobat — CPU back to normal,
  your Mac should feel responsive now").

### D2 — Memory pressure (the dangling-loop trap — do NOT hand off)
From `mac_system_info` / `vm_stat`, check swap and pressure.
- **Swap > 2 GB or memory pressure warn/critical** → real pressure. Identify
  the top memory consumers from `mac_process_list`.
- **Noah quits them itself** (with one approval), naming each app:
  "Firefox is using 2.3 GB across its tabs and TextNow another 760 MB —
  I'll quit both to free ~3 GB. OK?" → quit via `mac_kill_process`.
- Then **relieve and verify**: run `shell_run` `sudo purge` to reclaim inactive
  memory, re-check `vm_stat`, and report the freed amount in a `ui_done`.
- **Never** end on "close some tabs yourself." If a browser must stay open,
  quit the *other* memory hogs and still verify.
- **Normal, not a problem:** high *Compressed Memory* (macOS compressing
  inactive pages — good) and high *Cached Files* (free RAM used for caching —
  beneficial). Don't alarm the user about these.

### D3 — Disk full
From `mac_disk_usage`, check free space.
- **Boot disk > 90% full** → a near-full SSD causes severe slowdowns. Activate
  the `disk-space-recovery` playbook and let it close that loop.

### Restart — when nothing else stands out
If the Mac hasn't restarted in > 7 days (uptime from `mac_system_info`):
- macOS accumulates swap, caches, file descriptors, and leaked memory that a
  restart clears. It's the most underrated fix for "mystery slowness."
- Offer it plainly and let the user choose — a restart is theirs to trigger,
  but frame it as the recommended next step, not a shrug.

> D1–D3 + restart resolve ~80% of performance complaints. After diagnosis,
> if the Mac is merely "a bit sluggish" rather than pinned by one cause, offer
> the **`mac-tune-up`** playbook — a safe maintenance sweep.

## Caveats — DO NOT kill these (they look suspicious but are normal)
- **`kernel_task`** — thermal throttling. High CPU = the Mac is hot and
  deliberately slowing itself. Fix ventilation; don't use on a soft surface.
- **`WindowServer`** — display compositor. High CPU = many monitors, heavy
  animations, or a GPU-heavy app. Close complex-UI apps.
- **`mds` / `mds_stores`** — Spotlight indexing. Temporary after OS updates or
  restores; resolves in 30–60 min. Killing it just restarts indexing.
- **`trustd`** — certificate checks. Brief spikes are normal.
- **`backupd`** — Time Machine backup running. Temporary.
- **`bird` / `cloudd`** — iCloud sync. Heavy with large libraries. Temporary.

## Key signals (explain these instead of "fixing" them)
- **"Slow after an update"** → `mds` re-indexing / Time Machine snapshot /
  iCloud re-sync. All temporary — resolves within hours. Reassure the user.
- **"Fans loud but nothing open"** → `mds`, `backupd`, or `softwareupdated`
  spiking in the background. Temporary.
- **"Slow only in the morning"** → Login Items launching at boot. Point the
  user to System Settings → General → Login Items to trim. (Diagnose and
  guide; Noah does not auto-delete login items — see `mac-tune-up` non-goals.)
- **"One specific app is slow"** → not a system issue. The app may need an
  update or a cache reset. Consider the `app-doctor` playbook.
- **Chrome/Electron apps eating memory** → each tab/window is its own process,
  by design. Fewer tabs is the fix — and in D2, Noah quits them for the user.

## Portability note
macOS versions vary across customers. Treat `vm_stat`, `purge`, and the
`mac_*` tools as available everywhere (stable for many releases), but for any
`shell_run` step, check the result and degrade gracefully — report a step as
"skipped" if a command isn't present rather than failing the whole flow. Do
not assume a specific macOS version.

## Tools referenced
- `mac_system_info` — CPU, memory, disk, uptime overview
- `mac_process_list` — top processes by CPU and memory
- `mac_disk_usage` — disk space check
- `mac_kill_process` — force-quit a runaway process (NeedsApproval tier)
- `shell_run` — `vm_stat` (re-measure) and `sudo purge` (memory relief)

## Escalation
If performance is still poor after diagnosis:
- Apple Diagnostics (restart holding D) to check for hardware faults.
- Older Mac with an HDD → an SSD is the single biggest upgrade.
- RAM consistently maxed → more physical RAM (if upgradeable) or fewer
  simultaneous apps.
