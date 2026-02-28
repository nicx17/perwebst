# Nick Cardoso - Personal Portfolio & Infrastructure Logs

Welcome to the source code for my personal portfolio and technical documentation site. This repository serves as the frontend hub linking to my various software engineering projects, hardware experiments, and self-hosted infrastructure logs. 

**Live Website:** [link.nickcardoso.com](https://link.nickcardoso.com)

## Architecture & Tech Stack

This site is built with a focus on maximum performance, absolute minimalism, and dependency-free engineering.

* **Frontend:** 100% Vanilla HTML5 and CSS3. No heavy JavaScript frameworks, no Tailwind overhead, and no external UI libraries. 
* **Design System:** Custom CSS variables (`:root`) handling a refined light-theme aesthetic (`#FAF9F6` background / `#2D2D2D` text) and a fluid, mobile-first responsive layout via strict CSS `@media` queries. Typography deliberately relies on native OS system fonts (`system-ui`, `ui-serif`) for true zero-latency rendering.
* **Routing:** Extensionless (`/projects/hytrackv3` instead of `/projects/hytrackv3.html`) URL structuring powered by custom Apache `.htaccess` proxy rewrite rules.
* **Hosting Platform:** Entirely self-hosted on bare-metal edge hardware (Raspberry Pi 5 running Debian Linux).
* **Web Server:** Apache2 handling local HTML serving, situated behind an Nginx Proxy Manager (OpenResty) edge router for SSL termination and secure reverse proxying.

## Featured Projects

The `/projects` route dynamically showcases my standalone software engineering logic and hardware integrations. Some highlighted repositories currently linked include:

* **[HyTrackV3](https://github.com/nicx17/HyTrackV3)**: An autonomous, locally-hosted Python engine that ingests emails, actively scrapes dynamic courier sites via headless Selenium, constructs SHA-256 state hashes, and dispatches real-time shipment notifications.
* **[HyTrack API](https://github.com/nicx17/hytrackapi)**: The backend REST microservice powering HyTrack. Built with FastAPI and secured with military-grade bcrypt hashing, constant-time token comparison, and proactive slowapi rate-limiting.
* **[ImmichSync](https://github.com/nicx17/ImmichSync)**: A secure Python script utilizing targeted environment variables and recursive deduplication logic to safely synchronize local machine directories directly to an Immich backend server.
* **[MultiWave](https://github.com/nicx17/MultiWave)**: A custom-built, wirelessly communicating multi-cable tester encompassing C++ and Arduino Mega hardware logic. 

## Security & Validations

* **Strict DOM Compliance:** Every single HTML file rigorously conforms to the `html-validate` linter, guaranteeing 0 syntax errors, 0 raw/unescaped characters, and 0 inline styles.
* **Proxy Safety:** Apache `.htaccess` rewrite conditions natively ingest Nginx's `%{HTTP_HOST}` X-Forwarded headers to absolutely prevent internal routing topologies or loopback ports (`127.0.0.1:9393`) from leaking via HTTPS `Location` redirects.
* **Stateless Workspace:** Excludes all environment `.env` artifacts, `.DS_Store` caching, and production `.tar.gz` deployment bundles through stringent `.gitignore` indexing. 

## Local Development

To run this site locally on your own machine:

1. Clone this repository:
   ```bash
   git clone https://github.com/nicx17/pers.git
   ```
2. Navigate into the directory:
   ```bash
   cd pers
   ```
3. Boot a lightweight local Python HTTP server:
   ```bash
   python -m http.server 8000
   ```
4. Open your browser and navigate to `http://localhost:8000/`.

---
*Developed by Nick Cardoso.*
