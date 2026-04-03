---
title: Mimick
summary: A Rust GTK4 Linux sync client for Immich with retries, tray controls, and Flatpak deployment.
role: Engineering Student
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

## Overview
Mimick is a Linux-native desktop app that syncs local photos and videos to Immich automatically. It combines folder watching, retries, tray controls, and diagnostics in a GTK4 interface built for practical daily use.

## Key Features
- Background folder watch and queue-based syncing.
- Retry persistence and failed-item recovery workflows.
- Native tray controls and operational status visibility.
- Flexible folder-to-album mapping.
- Flatpak-focused deployment with Linux sandbox awareness.

## Workflow
1. Connect Immich endpoints and store API key in system keyring.
2. Choose watched folders and album mapping rules.
3. Run background monitoring and queued upload flow.
4. Intervene as needed using pause/resume, queue inspector, and diagnostics.

## Why It Stands Out
Mimick is designed for Linux users who self-host Immich and want robust automation without losing control. The app focuses on reliability first, with recovery and observability features treated as core product behavior.

## Install
Flatpak is the recommended path.

```bash
flatpak remote-add --user --if-not-exists mimick-repo https://nicx17.github.io/mimick/mimick.flatpakrepo
flatpak install --user mimick-repo io.github.nicx17.mimick
```

Live product page: https://immick.hyclotron.com/
