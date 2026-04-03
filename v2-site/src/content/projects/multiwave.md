---
title: MultiWave
summary: A custom-built, wirelessly communicating multi-cable tester for RJ45, RJ11, and BNC connections.
role: Engineering Student
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

## Overview
MultiWave is a custom-engineered, wirelessly communicating multi-cable tester for RJ45, RJ11, and BNC cable diagnostics. It uses a receiver module and remote transmitter module connected over nRF24L01 communication.

## Architecture and Hardware
- Receiver: Arduino Mega 2560 with OLED interface and LED state feedback.
- Transmitter: Arduino-based remote unit that reads and returns pin states.
- Wireless bridge: nRF24L01+PA+LNA modules for communication.
- Portable operation: battery management and step-up conversion in receiver enclosure.

## Testing Modes
1. Continuity mode: sequential pin-state verification.
2. Wiring mode: alignment validation for network cable layouts.
3. Short mode: identifies multi-high fault conditions.
4. Manual mode: user-controlled per-pin stepping for targeted diagnostics.

## Core Components
- Arduino Mega 2560 and Mega 2560 Pro
- nRF24L01+PA+LNA transceivers
- 1.3 inch I2C OLED display
- TP4056 battery modules and DC-DC step-up converter
- RJ45, RJ11, and BNC breakout interfaces
