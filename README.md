# Nick Cardoso — Personal Portfolio

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://spdx.org/licenses/GPL-3.0-only.html)

Source for my personal portfolio site. Links to software engineering projects, hardware experiments, and self-hosted infrastructure work.

**Live site:** [link.nickcardoso.com](https://link.nickcardoso.com)

---

## Stack

Astro 5 SSR with `@astrojs/node` standalone adapter, TypeScript strict mode, file-based typed content collections.

Served via PM2 managed Node process, behind Cloudflare.

---

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:4321/`.

| Script | Purpose |
|---|---|
| `npm run dev` | Astro dev server with HMR — no build step needed |
| `npm run build` | Compile SSR bundle to `dist/` |
| `npm run start` | Run the compiled production server (`dist/server/entry.mjs`) |
| `npm run preview` | Astro's built-in preview of the last build |
| `npm run check` | Typecheck (`astro sync && tsc --noEmit`) |
| `npm run test` | Run test suite (Vitest) |
| `npm run optimize:backgrounds` | Compress background assets |

**Dev vs production differences:**

| | Dev (`npm run dev`) | Production (`npm run start` / PM2) |
|---|---|---|
| Server | Vite HMR dev server | Compiled Node standalone (`dist/server/entry.mjs`) |
| `site` URL | Uses `ORIGIN` when provided (otherwise defaults to production URL) | Requires a valid `ORIGIN`; startup fails if invalid |
| HSTS header | Not sent (HTTP) | Sent on HTTPS requests |
| Cache headers | Set by middleware | Set by middleware |
| Hot reload | Yes | No — requires `npm run build` + restart |

---

## Projects

- **[HyTrackV3](https://github.com/nicx17/HyTrackV3)** — Autonomous Python tracking engine with headless Selenium scraping, SHA-256 state hashing, and real-time shipment notifications.
- **[HyTrack API](https://github.com/nicx17/hytrackapi)** — FastAPI backend for HyTrack with bcrypt auth, constant-time token comparison, and rate limiting.
- **[ImmichSync](https://github.com/nicx17/ImmichSync)** — Python script for recursive, deduplicated directory sync to an Immich backend.
- **[Mimick](https://github.com/nicx17/mimick)** — GTK4 + Libadwaita Linux desktop app for Immich sync with tray controls and Flatpak packaging.
- **[Unstats](https://github.com/nicx17/unstats)** — Home Assistant HACS integration surfacing live Unsplash account stats.
- **[MultiWave](https://github.com/nicx17/MultiWave)** — Wireless multi-cable tester on C++ and Arduino Mega.
- **[InfinityX](https://github.com/nicx17/InfinityX)** — ESPHome config wiring an ESP32 inside a Bluetooth speaker for Home Assistant GPIO control.

---

## Deployment

See [`docs/deployment.md`](docs/deployment.md) for the PM2 setup guide, env variable reference, smoke checks, and rollback procedure.

---

## Security & CI


- HTML validated in CI with `html-validate`
- Link integrity checked with `lychee` (config: `lychee.toml`)
- Lighthouse CI audits on core routes
- Strict modern web security implementation (`src/middleware.ts`):
  - **Cross-Origin Isolation**: Enforced via `COOP` and `COEP: require-corp` to mitigate transient execution attacks.
  - **XSS Prevention**: Strict nonce-based Content Security Policy (CSP).
  - **Fetch Metadata Validation**: Edge rejection of untrusted cross-site requests via `Sec-Fetch-*` header logic.
  - **Transport & Telemetry**: Full HSTS enforcement, User-Agent Client Hints (`Accept-CH`), and comprehensive Reporting API endpoints for CSP violations.
- No secrets in repo — environment loaded from `.env` at runtime, never committed

---

## License

GPLv3 — see [GNU GPL v3.0](https://spdx.org/licenses/GPL-3.0-only.html).

Developed by [Nick Cardoso](https://link.nickcardoso.com).
