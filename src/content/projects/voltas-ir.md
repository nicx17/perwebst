---
title: Voltas IR Mapping
summary: Complete IR code database, fully decoded protocol documentation, and ready-to-use Home Assistant integration for the Voltas 183V DZU2 AC.
icon: /project-icons/voltas-ir.svg
repository: https://github.com/nicx17/Voltas-183V-DZU2-IR-CODES
repositoryLabel: nicx17/Voltas-183V-DZU2-IR-CODES
canonicalPath: /projects/voltas-ir/
tags:
  - ESPHome
  - Home Assistant
  - Reverse Engineering
  - C++
  - Python
order: 8
featured: true
---

## Product Snapshot

This project provides a comprehensive database and complete protocol decode for the Voltas 183V DZU2 split AC infrared remote. It features 74 captured IR signals covering every temperature, fan speed, mode, and feature combination.

The project goes beyond just recording codes by providing a fully functional Home Assistant integration via an ESPHome custom climate component.

## Full Protocol Decode

Through extensive reverse engineering, the 48-bit NEC-extended protocol operating at 38kHz was fully decoded. This deep understanding enables features such as:

- **Gray-coded Temperature:** Temperature values (17-30C) are accurately encoded using a Gray-coded nibble.
- **State Management:** Fan speeds, operating modes (Cool, Dry, Heat), and timer settings are programmatically generated rather than relying entirely on a massive database of static codes.
- **Timer Support:** Allows for setting 0.5h to 24h auto-off and auto-on timers directly through the generated frames.

## Ecosystem Integrations

The decoded protocol was built into integrations for multiple platforms:

### Home Assistant (ESPHome)

A custom C++ component allows an ESP32 or similar microcontroller to appear as a native Climate entity in Home Assistant. This supports all AC functions, including Turbo, Sleep, Eco, and Follow Me modes, seamlessly bridging the legacy IR appliance into a modern smart home ecosystem.

### Flipper Zero

Pre-built `.ir` files are included, allowing Flipper Zero users to directly import the entire database. A Python utility (`json_to_flipper.py`) is provided to automate the conversion from the captured JSON database to the Flipper format.

## Custom Hardware & Tooling

To ensure accurate capture and mapping, custom tooling was developed:

- **Interactive Python Recorder:** A serial-based recorder script that interfaces with an Arduino to auto-detect, deduplicate, and label incoming IR signals.
- **Arduino Firmware:** Custom IR receiver and transmitter sketches utilizing the `IRremote` library to capture the 48-bit frames with precise timing.

## Why This Project Is Valuable

This mapping project is an excellent resource for anyone looking to understand appliance IR protocol reverse-engineering. It provides a start-to-finish workflow: from hardware signal capture, to software decoding and deduplication, and finally to a production-ready smart home integration.
