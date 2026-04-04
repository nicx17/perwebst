---
title: HyTrackV3
summary: Email-driven shipment intelligence engine that monitors waybills and pushes status-change notifications.
icon: /project-icons/hytrackv3.png
repository: https://github.com/nicx17/HyTrackV3
repositoryLabel: nicx17/HyTrackV3
canonicalPath: /projects/hytrackv3/
tags:
  - Python
  - Selenium
  - SQLite
  - BeautifulSoup
order: 4
featured: true
---

## Product Snapshot
HyTrackV3 is a self-hostable shipment monitoring pipeline that turns inbox waybills into structured tracking intelligence. It continuously ingests new shipment IDs, routes each one through the right courier scraper, detects status deltas, and sends notifications only when meaningful changes occur.

## Core Objective
The system is built to reduce tracking noise while preserving visibility:

- no manual copy-paste checks across courier portals
- no repeated "same status" notifications
- durable local state that survives restarts
- low-cost operation on home infrastructure

## End-to-End Processing Flow
1. IMAP ingestion scans mailbox content for candidate waybill identifiers.
2. Parsing and normalization clean extracted values and remove obvious invalid IDs.
3. Courier routing chooses adapter logic based on ID pattern/rules.
4. Scraper execution pulls raw status timelines from courier systems.
5. Normalization converts output into a shared internal event model.
6. State compare checks against previously stored snapshot/hash.
7. Notification engine emits HTML email only on true state transition.
8. Persistence layer updates local tracking records in SQLite.

## Courier Adapter Architecture
HyTrackV3 intentionally uses mixed scraping paths:

- Blue Dart: request + BeautifulSoup path for static/parseable pages
- Delhivery: Selenium headless path for dynamic JavaScript-heavy pages

This is a practical tradeoff: keep static providers fast and lightweight, while preserving compatibility for rendered portals that cannot be parsed reliably from raw HTML alone.

## State, Idempotency, and Noise Control
SQLite is the local source of truth for:

- shipment metadata
- latest known event timeline snapshot
- notification suppression state
- delivered/completed markers

The state-hash comparison model is central to reliability. It ensures scheduled runs remain idempotent and users are alerted only when something has actually changed.

## Notification System Design
HyTrackV3 sends readable HTML status updates designed for fast scanning. Instead of forwarding raw courier output, it presents normalized tracking progression so recipients can understand changes quickly.

## Runtime and Deployment Model
The project runs well in two common modes:

- manual trigger for ad-hoc checks
- cron/scheduled automation for continuous monitoring

This makes it suitable for Raspberry Pi, NAS, or small Linux VM deployments without requiring dedicated cloud infrastructure.

## Operational Strengths
- multi-courier compatibility through adapter separation
- change-only notifications for low alert fatigue
- durable local DB for restart-safe tracking
- scheduler-friendly architecture for unattended operation

## Public Onboarding Route
Repository docs include a hosted onboarding entrypoint via:
notify@hyclotron.com
