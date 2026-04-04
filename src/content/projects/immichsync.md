---
title: ImmichSync
summary: Python-based folder-to-Immich sync automation with route fallback, deduplication, and album-aware uploads.
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

## Product Snapshot
ImmichSync is a lightweight Python sync utility that pushes local media folders into Immich with repeatable, automation-friendly behavior. The emphasis is reliability over complexity: deterministic upload flow, route fallback, duplicate handling, and clear logs.

## Primary Use Case
The script is designed for people who already maintain local photo/video folders and want a low-maintenance path to keep Immich up to date without re-uploading the same files repeatedly.

## End-to-End Sync Flow
1. Load configuration and API credentials from environment variables.
2. Probe local Immich route first (LAN preference), then fail over to external route.
3. Resolve destination album state.
4. Walk source media tree and compare against local upload history.
5. Upload missing assets.
6. Handle server duplicate responses without failing the run.
7. Attach assets to the target album.
8. Write progress and outcome logs for auditability.

## Networking and Route Fallback
ImmichSync includes local/external endpoint logic so the same script can run reliably across network contexts:

- LAN path when running inside home network
- WAN path when local route is unavailable

This avoids hardcoding one environment and reduces brittle deployment behavior.

## Duplicate and Idempotency Behavior
Two protection layers reduce duplicate uploads:

- local upload history suppresses repeated attempts across runs
- duplicate-aware response handling allows safe continuation when server sees known files

This makes scheduled runs effectively additive and predictable.

## Logging and Operations
The script emits output to both console and file, which is important for unattended operation and troubleshooting. Typical operational loop is cron/scheduler-based periodic sync with occasional manual review of logs.

## Security Model
- API key is externalized via `.env`
- no credential hardcoding in script body
- expected workflow keeps secrets out of version control

## Quick Run
```bash
pip install requests python-dotenv
python uploader_v1.py
```

## Typical Inputs
- source folder path
- Immich API key
- local Immich URL
- external fallback URL
- destination album name

## Why This Project Is Valuable
ImmichSync demonstrates how a single-purpose script can still be production-practical: clear state handling, safe retries, network flexibility, and operator-friendly logs without requiring a heavy framework.
