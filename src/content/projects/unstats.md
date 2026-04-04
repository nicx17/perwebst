---
title: Unstats
summary: Home Assistant integration for Unsplash account metrics with a privacy-preserving relay architecture.
icon: /project-icons/unstats.png
repository: https://github.com/nicx17/unstats
repositoryLabel: nicx17/unstats
canonicalPath: /projects/unstats/
tags:
  - Python
  - Home Assistant
  - HACS
  - API Integration
order: 7
featured: false
---

## Product Snapshot
Unstats is a Home Assistant integration that converts Unsplash profile analytics into first-class HA entities. Instead of ad-hoc scripts, it provides a native config-entry setup flow and stable periodic updates suitable for dashboarding and automation.

## What Problem It Solves
Unsplash stats are useful personal telemetry, but the default path usually means manual checks or custom scripts. Unstats packages that into a maintainable integration with:

- clean HA onboarding
- predictable update behavior
- metrics exposed as standard sensor entities
- privacy-conscious credential boundary

## Entity and Data Model
The integration exposes total-increasing style sensors, including key profile metrics such as:

- views
- downloads

Hourly polling is intentionally conservative to keep dashboards stable and avoid noisy state churn.

## Privacy-Centered Relay Architecture
Unstats separates user identity from upstream API credentials through a relay model:

1. Home Assistant sends only username-level lookup input.
2. Relay applies server-side Unsplash credentials.
3. Relay returns minimal metric payload to HA.

This reduces the risk of leaking sensitive API credentials into local home automation environments.

## Home Assistant Integration Behavior
Unstats aligns with HA integration conventions:

- config-entry based setup through Devices and Services
- lifecycle-aware entity creation/removal
- HACS installation support with manual fallback path

The result is an integration that behaves like native HA components rather than one-off custom automation code.

## Operational Characteristics
- low-maintenance refresh cadence
- dashboard-friendly monotonic metrics
- straightforward troubleshooting surface
- practical for always-on HA deployments

## Why This Project Is Distinct
Unstats is a focused example of turning an external analytics source into home telemetry without overengineering. The architecture deliberately favors usability and safer credential boundaries, which is often the real blocker for personal integrations.
