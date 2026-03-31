# Nick Cardoso — Personal Portfolio & Infrastructure Logs

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/nicx17/pers?color=blue)](https://github.com/nicx17/pers/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Welcome to the source code for my personal portfolio and technical documentation site. This repository serves as the frontend hub linking to my various software engineering projects, hardware experiments, and self-hosted infrastructure logs. 

**Live Website:** [link.nickcardoso.com](https://link.nickcardoso.com)

---

##  Architecture & Tech Stack

This site is built with a hyper-focus on maximum performance, absolute minimalism, and zero-dependency engineering. It scores a flawless **100/100 on Google Lighthouse** for Performance across both [Desktop](https://pagespeed.web.dev/analysis/https-link-nickcardoso-com/2zw9esilz5?form_factor=desktop) and [Mobile](https://pagespeed.web.dev/analysis/https-link-nickcardoso-com/2zw9esilz5?form_factor=mobile) metrics.

* **Frontend:** 100% Vanilla HTML5 and CSS3. No heavy JavaScript frameworks (React/Vue), no Tailwind overhead, and zero external UI libraries. 
* **Design System:** Custom CSS variables (`:root`) handling a refined light-theme aesthetic (`#FAF9F6` background / `#2D2D2D` text) and a fluid, mobile-first layout. Typography deliberately relies on native OS system fonts (`system-ui`, `ui-serif`) for true zero-latency rendering and zero Layout Shifts (CLS).
* **Zero External Dependencies:** Removed all CDN requests (including FontAwesome) in favor of crisp, embedded inline SVG paths to permanently eliminate Render Blocking network requests.
* **Routing & Caching:** Extensionless URL structuring (`/projects/hytrackv3`) powered by custom Apache `.htaccess` proxy rewrite rules, alongside aggressive `mod_expires` and `Cache-Control (max-age=31536000)` headers for instant return-visitor paints.
* **Infrastructure:** Entirely self-hosted on bare-metal edge hardware (Raspberry Pi 5 running Debian Linux) served via an Apache2 engine sat behind an Nginx Proxy Manager (OpenResty) edge router.

---

##  Featured Projects

The `/projects` route dynamically showcases my standalone software engineering logic and hardware integrations. Highlighted repositories include:

* **[HyTrackV3](https://github.com/nicx17/HyTrackV3)**: An autonomous, locally-hosted Python engine that ingests emails, actively scrapes dynamic courier sites via headless Selenium, constructs SHA-256 state hashes, and dispatches real-time shipment notifications.
* **[HyTrack API](https://github.com/nicx17/hytrackapi)**: The backend REST microservice powering HyTrack. Built with FastAPI and secured with military-grade bcrypt hashing, constant-time token comparison, and proactive slowapi rate-limiting.
* **[ImmichSync](https://github.com/nicx17/ImmichSync)**: A secure Python script utilizing targeted environment variables and recursive deduplication logic to safely synchronize local machine directories directly to an Immich backend server.
* **[Mimick](https://github.com/nicx17/mimick)**: A Linux-first GTK4 and Libadwaita desktop app that automatically syncs local media into Immich with retries, diagnostics, tray controls, and Flatpak-friendly packaging.
* **[Unstats](https://github.com/nicx17/unstats)**: A native Home Assistant custom integration (HACS) that acts as an edge client to securely fetch and provision live Unsplash account statistics natively within the Python event loop.
* **[MultiWave](https://github.com/nicx17/MultiWave)**: A custom-built, wirelessly communicating multi-cable tester encompassing C++ and Arduino Mega hardware logic.
* **[InfinityX](https://github.com/nicx17/InfinityX)**: An ESPHome configuration that physically integrates an ESP32 microcontroller inside a Bluetooth speaker, wiring GPIO outputs to the speaker's physical buttons for native Home Assistant control.

---

##  Security & Validations

> [!NOTE]
> This repository stays intentionally lightweight, but the static pages are still checked in CI to keep the site consistent and safe to ship.

* **Strict DOM Compliance:** HTML pages are validated in CI with `html-validate` to catch syntax and structure issues before deployment.
* **Link Integrity Checks:** A dedicated link-check workflow verifies internal routes and important outbound references across HTML and Markdown files.
* **Performance Regression Guard:** Lighthouse CI audits core public pages from a locally served copy of the site so major performance regressions are easier to catch early.
* **Header Fortification:** Apache `.htaccess` rewrite conditions natively ingest Nginx's `%{HTTP_HOST}` X-Forwarded headers to absolutely prevent internal routing topologies or loopback ports from leaking via HTTPS `Location` redirects.
* **Stateless Repository:** Stringent `.gitignore` indexing excludes all local `.env` artifacts, IDE `.DS_Store` caching, Cloudflare deployment logs, and generated minification scripts.

---


##  License

This project is licensed under the GPLv3 License - see the [LICENSE](LICENSE) file for full details.

Developed by [Nick Cardoso](https://link.nickcardoso.com).
