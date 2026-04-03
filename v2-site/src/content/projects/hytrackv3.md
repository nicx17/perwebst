---
title: HyTrackV3
summary: A self-hosted tracking engine that monitors emails for waybills and dispatches real-time status notifications.
role: Engineering Student
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

## Overview
HyTrackV3 is a self-hosted, headless tracking engine designed for users who want a centralized solution to monitor multiple shipments. Instead of manually checking tracking numbers across different courier websites, HyTrackV3 automatically extracts new tracking numbers from your inbox, tracks them in the background, and emails formatted updates when a package transit status changes.

## Key Features
- Automatic discovery: scans Gmail or Outlook inboxes for new Blue Dart and Delhivery tracking numbers.
- Smart change detection: uses SHA-256 hashing to compare a shipment fingerprint against previous state.
- Hybrid web scraper: uses requests and BeautifulSoup for static pages and headless Selenium for dynamic pages.
- Notification flow: dispatches formatted email updates with tracking links and status progression.

## How It Works
1. Ingestion: logs into IMAP and extracts candidate tracking IDs with regex patterns.
2. Tracking: routes each waybill to the proper carrier scraper.
3. Analysis: hashes latest event data and compares it to the stored state.
4. Notification: sends email updates only when state changes.

## Database and State Management
The system uses a lightweight SQLite table to avoid duplicate notifications and keep tracking state durable between runs.

| Column | Type | Description |
|---|---|---|
| waybill | TEXT (PK) | Unique tracking number. |
| courier | TEXT | Carrier identifier (BLUEDART or DELHIVERY). |
| last_event_hash | TEXT | SHA-256 hash of last known shipment event. |
| is_delivered | INTEGER | Boolean flag (0/1) to stop further checks. |

## Try It Out
- Tracking email: notify@hyclotron.com
