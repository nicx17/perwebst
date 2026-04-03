---
title: ImmichSync
summary: A secure Python script that syncs local folders to Immich with deduplication and album mapping.
role: Engineering Student
repository: https://github.com/nicx17/ImmichSync
repositoryLabel: nicx17/ImmichSync
canonicalPath: /projects/immichsync/
tags:
  - Python
  - Immich API
  - Automation
  - Sync
order: 6
featured: false
---

## Overview
ImmichSync is a Python automation script that syncs a local image folder to an Immich server. It supports local-network and external routes, prevents duplicate uploads, and can organize assets into a target album.

## Features and Working Mechanism
1. Environment loading: securely loads credentials and runtime config values.
2. Network detection: attempts local URL first, then falls back to external URL.
3. Album resolution: looks up target album ID through Immich API.
4. Local deduplication: checks `immich_upload_history.json` to skip prior uploads.
5. Server deduplication and upload: handles new uploads and duplicate responses correctly.
6. Album linking: attaches uploaded assets to the configured album.
7. Status logging: writes operation logs to console and file.

## Security Considerations
- Uses API key loaded from `.env` and intended to stay out of version control.
- Implements additive sync behavior and does not modify local source files.
- Maintains local upload history to reduce duplicate API load.

## Installation and Usage
```bash
pip install requests python-dotenv
python uploader_v1.py
```

Required environment variables include path, API key, local and external URLs, and album name.
