---
title: Picoaudio
summary: A Bluetooth A2DP audio receiver for the Raspberry Pi Pico 2 W that outputs 16-bit stereo PCM over I2S.
icon: /project-icons/picoaudio.svg
repository: https://github.com/nicx17/picoaudio
repositoryLabel: nicx17/picoaudio
canonicalPath: /projects/picoaudio/
tags:
  - C/C++
  - Raspberry Pi Pico 2 W
  - BTstack
  - Bluetooth
  - Hardware
order: 7
featured: true
---

## Product Snapshot

Picoaudio is a Bluetooth A2DP audio receiver designed for the Raspberry Pi Pico 2 W. It successfully receives Bluetooth audio and outputs 16-bit stereo PCM over I2S to a CJMCU-1334 (UDA1334A) DAC.

Built utilizing the BTstack library alongside the Pico C/C++ SDK, this project transforms an inexpensive microcontroller into a capable wireless audio receiver.

## Architecture & Features

The system implements a dual-core architecture to ensure reliable audio playback:

- **Dual-Core Processing:** Offloads heavy SBC audio decoding entirely to Core 1 via a hardware-spinlock queue. This ensures that the Bluetooth stack on Core 0 never drops packets due to CPU starvation.
- **Ultra-Low Latency:** Optimized buffer sizes (I2S DMA and thread-safe queue) to achieve ~55ms total audio latency, perfect for lip-synced video playback.
- **Multipoint Bluetooth:** Supports 2 simultaneous A2DP and AVRCP connections. The firmware multiplexes incoming streams by maintaining independent connection states and decoding only the active stream.
- **Hardware I2S Output:** Uses PIO and DMA to stream decoded audio to the I2S DAC at 44.1 kHz.
- **Drift Synchronization:** Implements dynamic software resampling to synchronize the incoming Bluetooth clock with the RP2350 hardware I2S clock.
- **Hardware Mute & AVRCP Volume:** Physical GPIO toggles hardware mute on the DAC, while processing AVRCP absolute volume commands with a logarithmic scaling function.

## UI Sound Synthesizer

A notable feature is the built-in UI sound synthesizer. It utilizes a blocking square-wave synthesizer that injects status tones directly into the I2S hardware pool on boot, connection, and disconnection events, providing audible feedback without requiring external audio files.

## Technical Data Flow

The project maintains a clean and efficient data flow pipeline:

1. SBC encoded audio (~328 kbps) is received wirelessly via the CYW43439 Radio.
2. Core 0 handles the BTstack (A2DP Sink) processing.
3. Data is passed through a thread-safe queue to Core 1.
4. Core 1 manages the SBC Decoding (bitpool 53), AVRCP Volume Scaling, and pushes to the PIO I2S State Machine via DMA.
5. Audio is outputted to the CJMCU-1334 DAC, driving speakers or headphones.

## Why This Project Is Valuable

Picoaudio demonstrates advanced embedded systems programming, including dual-core synchronization, PIO state machine implementation for I2S, and real-time audio processing. It serves as a practical, high-performance solution for breathing new life into older speaker systems by adding reliable Bluetooth capabilities.
