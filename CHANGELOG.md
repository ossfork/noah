# Changelog

All notable changes to Noah for Tinkerers are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-07-04

The first release of the **open-source, bring-your-own-key** build of Noah.

### Added
- Bring-your-own-key operation — Noah talks to Claude directly from your machine with your
  own Anthropic key. No account, no backend, no subscription.
- 26 bundled Markdown **playbooks** (network diagnostics, disk recovery, printer repair, VPN,
  backups, browser security, performance forensics, and more). Drop your own `.md` into the
  playbooks directory and Noah runs it too — no rebuild, no plugin API.
- Local **Knowledge** store — Noah remembers your system, past fixes, and preferences,
  on-device and written as plain files you can read.
- **Design notes** (`docs/design/`) — engineering deep-dives on the generative UI, the safety
  harness, the single-thread UI/LLM model, and the no-backend architecture.
- Linux builds (`.AppImage`) alongside macOS (`.dmg`) and Windows (`.msi` / `.exe`).

### Changed
- New **monochrome** visual identity and wrench mark, distinct to the open build.
- Relicensed to **AGPL-3.0**.
- The Anthropic API key file is now restricted to owner-only permissions.

### Removed
- Server-dependent features — background health monitoring, Auto-Heal, and Health Scorecards —
  are not part of the bring-your-own-key build.

### Security
- A safety harness around every action: read-only diagnostics first, an explicit plan,
  approval gating for risky commands, and a hard-deny floor that permanently refuses
  catastrophic operations (wiping your home folder or keychains, erasing a disk) — even if asked.

---

Older history (the v1.x pre-open-source line) is on the
[Releases page](https://github.com/noahapp/noah-for-tinkerers/releases).
