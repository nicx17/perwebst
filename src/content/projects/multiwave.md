---
title: MultiWave
summary: Wireless dual-node cable tester for RJ45, RJ11, and BNC diagnostics with multiple validation modes.
repository: https://github.com/nicx17/MultiWave
repositoryLabel: nicx17/MultiWave
canonicalPath: /projects/multiwave/
tags:
  - C++
  - Arduino
  - Hardware
  - nRF24L01
order: 1
featured: true
---

## Product Snapshot
MultiWave is a purpose-built field diagnostics device that tests RJ45, RJ11, and BNC cables through a wireless two-node architecture. It was designed for practical cable verification in environments where both cable ends are physically separated.

## Engineering Goal
Traditional cable testers are often tethered and connector-specific. MultiWave aims to provide:

- multi-connector support in one platform
- untethered endpoint validation over RF
- mode-driven diagnostics for both quick checks and deep fault isolation
- portable operation with dedicated power management

## Two-Node System Architecture
The platform is split across two physical units:

- receiver/controller node:
  - drives test sequencing
  - energizes and scans pin patterns
  - renders operator feedback on OLED and LEDs
- transmitter/remote node:
  - senses remote conductor states
  - returns readings to controller in near real time
- RF link:
  - nRF24L01+PA+LNA modules for bidirectional communication

This architecture allows end-to-end testing without dragging both cable ends to a single enclosure.

## Diagnostic Mode Design
1. Continuity mode:
  - validates line-by-line conductor integrity
  - quickly identifies opens and missing paths
2. Wiring mode:
  - checks expected pin map standards
  - catches swaps and crossover mistakes
3. Short mode:
  - detects unintended coupling between lines
  - useful for damaged crimps/connectors
4. Manual mode:
  - pin stepping for targeted technician debugging
  - enables deterministic fault tracing

## Hardware and Interface Stack
- Arduino Mega 2560 + Mega 2560 Pro
- 1.3" I2C OLED for status/UI
- LED arrays for immediate visual pin feedback
- RJ45, RJ11, and BNC connector interfaces
- battery + boost/power subsystem for portability

## Firmware Characteristics
MultiWave firmware coordinates pin drive/read cycles, RF message exchange, and display updates under a deterministic test loop. Mode separation keeps operator workflows clear and reduces ambiguity during field diagnostics.

## Practical Field Advantages
- supports mixed connector environments
- avoids single-box physical limitations
- gives both quick pass/fail and detailed analysis paths
- designed for mobile usage rather than bench-only operation

## Why This Build Is Significant
MultiWave is a full-stack hardware project in the real sense: embedded firmware, RF transport design, electrical interface mapping, device UX, and power/enclosure engineering all had to align for reliable on-site operation.
