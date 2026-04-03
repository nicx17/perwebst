---
title: InfinityX
summary: ESPHome integration that embeds an ESP32 inside a Bluetooth speaker for Home Assistant control.
role: Engineering Student
repository: https://github.com/nicx17/InfinityX
repositoryLabel: nicx17/InfinityX
canonicalPath: /projects/infinityx/
tags:
  - ESPHome
  - Home Assistant
  - ESP32
  - Hardware
order: 2
featured: false
---

## Overview
InfinityX embeds an ESP32 directly inside an Infinity Bluetooth speaker to add Home Assistant control. The integration mimics physical button presses while reading runtime power state back into the automation platform.

## Key Features
- Direct hardware integration for play/pause, power, and volume controls.
- Self-powered operation from speaker internals.
- Power-state sensor for Home Assistant status and automations.

## Hardware Configuration
- PWR control: GPIO16
- Play/Pause control: GPIO17
- Volume up control: GPIO18
- Volume down control: GPIO19
- Power-state input: GPIO34

## Home Assistant Integration
The device is exposed via native ESPHome integration with entity-based controls and status reporting.
