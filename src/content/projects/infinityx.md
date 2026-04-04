---
title: InfinityX
summary: ESPHome-powered hardware mod that turns a Bluetooth speaker into a Home Assistant controllable device.
icon: /project-icons/infinityx.png
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

## Product Snapshot
InfinityX is a hardware-first integration project that places an ESP32 inside a consumer Bluetooth speaker and bridges the speaker's physical controls into Home Assistant through ESPHome. The key idea is simple but practical: keep the original speaker behavior untouched, then add a software layer that can trigger those same actions remotely.

## Problem It Solves
Most Bluetooth speakers are either fully "dumb" from a home automation perspective or require replacing internal firmware entirely. InfinityX targets the middle ground:

- no firmware replacement of the original speaker board
- no cloud dependency
- no custom Home Assistant integration code
- direct local control for automations and dashboards

## Electrical Integration Strategy
The project taps into the existing button lines and emulates momentary presses from the ESP32 GPIO outputs. This keeps behavior aligned with the factory control board and avoids reverse-engineering full speaker firmware internals.

Practical wiring map:

- GPIO16: Power button line
- GPIO17: Play/Pause line
- GPIO18: Volume up line
- GPIO19: Volume down line
- GPIO34: Power-state sensing input

## Firmware Control Model (ESPHome)
InfinityX exposes button-like actions rather than pretending the speaker is a native media endpoint. That model is deliberate: it matches real hardware capabilities and remains stable even if internal speaker logic changes.

Typical action semantics include:

- short press for play/pause and volume changes
- configurable press windows for power behavior
- state sensing input that can be consumed by automations

## Home Assistant Entity Experience
Because the stack is ESPHome-native, setup is straightforward:

1. flash and join the ESP32 to the local network
2. allow ESPHome/Home Assistant discovery
3. map entities to dashboard controls and scripts

From there, InfinityX can participate in routines like:

- scheduled playback windows
- occupancy-based auto power control
- voice assistant routines that trigger physical speaker controls

## Reliability Considerations
A major strength of this build is that it remains "button-faithful."
If Home Assistant is unavailable, the speaker still works as a normal speaker from its original controls. The automation layer is additive, not destructive.

## Safety and Validation Notes
Before soldering, button lines and input characteristics must be validated directly on the target board. InfinityX intentionally documents this as a non-optional step to avoid accidental board damage.

## Why This Project Stands Out
InfinityX combines embedded hardware work, electrical probing, firmware configuration, and smart-home automation design in one compact build. It is not just an ESPHome demo; it is a practical retrofit pattern for turning offline consumer hardware into reliable local smart devices.
