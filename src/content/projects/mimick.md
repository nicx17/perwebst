---
title: Mimick
summary: Linux-native Immich desktop sync with resilient queueing, tray controls, diagnostics, and Flatpak delivery.
icon: /project-icons/mimick.png
repository: https://github.com/nicx17/mimick
repositoryLabel: nicx17/mimick
canonicalPath: /projects/mimick/
tags:
  - Linux
  - Rust
  - GTK4
  - Immich
order: 3
featured: true
liveUrl: https://immick.hyclotron.com/
---

## Product Snapshot
Mimick is a Linux-native Immich desktop client built in Rust with GTK4/Libadwaita. It combines consumer-friendly tray behavior with operator-grade sync controls, making it suitable for both casual usage and long-running unattended media pipelines.

## Why Mimick Exists
Many desktop uploaders fail in one of two ways:

- too simple: little control, poor diagnostics, weak recovery behavior
- too brittle: background sync stalls, duplicate noise, poor network adaptation

Mimick is designed to close that gap with a reliability-first architecture.

## Technical Architecture
Mimick is structured around clear functional layers:

- UI layer: GTK4 desktop interface and tray-oriented control flow
- Watch layer: file/folder monitoring with "settling" checks before enqueue
- Queue layer: configurable worker concurrency and retry orchestration
- Sync index: local state to skip unchanged/already-synced media
- Upload layer: Immich API interaction including duplicate-aware handling
- Album layer: album placement and reassociation behavior

## Sync Engine Behavior
The engine is optimized for real-world folder churn:

- avoids premature uploads for actively changing files
- preserves queue state for crash/restart recovery
- replays retriable failures instead of silently dropping jobs
- keeps throughput predictable via bounded worker model

## Network and Endpoint Strategy
Mimick includes LAN/WAN route logic so users can move between local and remote contexts without manually reconfiguring every session. This is especially useful for laptop-first workflows.

## Security and Credential Handling
The app integrates keyring-backed credential storage so API keys are not written into plain config files. Combined with diagnostics redaction, this supports safer support/debug workflows.

## Observability and Support Tooling
Operational tooling is a major differentiator:

- diagnostics export for issue reports
- connectivity-loss signals and recovery visibility
- queue-level status that explains what is waiting, running, or retrying
- reduced alert noise through batched notification style

## Distribution and Installation
Mimick follows a Flatpak-first distribution path, while still documenting native Linux build routes for advanced users.

```bash
flatpak remote-add --user --if-not-exists mimick-repo https://nicx17.github.io/mimick/mimick.flatpakrepo
flatpak install --user mimick-repo io.github.nicx17.mimick
```

## Practical Outcome
Mimick is not just a GUI for uploads; it is an operationally aware desktop sync system that combines native UX, robust queue semantics, safer credential handling, and production-practical failure recovery.

Live page: https://immick.hyclotron.com/
