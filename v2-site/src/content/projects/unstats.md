---
title: Unstats
summary: A Home Assistant custom integration that fetches Unsplash metrics through a privacy-preserving edge proxy.
role: Engineering Student
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

## Overview
Unstats is a Home Assistant custom integration that fetches Unsplash statistics natively while preserving user privacy through a relay architecture.

## Key Features
- Hourly refresh of core telemetry sensors.
- Native Home Assistant integration and HACS install path.
- Privacy-preserving relay design that keeps API credentials off client nodes.

## Telemetry Sensors
- `sensor.unsplash_views`
- `sensor.unsplash_downloads`
- `sensor.unsplash_likes`

## Privacy Architecture
1. Home Assistant sends only username data to edge relay.
2. Relay appends protected Unsplash credentials server-side.
3. Relay returns JSON result and does not persist requester telemetry.

## Installation
1. Add custom HACS repository: `https://github.com/nicx17/unstats`
2. Restart Home Assistant.
3. Add integration in Settings > Devices and Services.
