---
title: Mimick
summary: Desktop Immich client for Linux built in Rust with GTK4. Monitors folders, manages upload queues, and syncs media to your Immich server with resilient queueing and environment-aware operation.
icon: /project-icons/mimick.png
repository: https://github.com/nicx17/mimick
repositoryLabel: nicx17/mimick
canonicalPath: /projects/mimick/
tags:
  - Linux
  - Rust
  - GTK4
  - Immich
  - Flatpak
  - Tokio
order: 3
featured: true
liveUrl: https://nicx17.github.io/mimick/
---

<div class="mimick-hero">
  <div class="mimick-hero-logo">
    <img src="/project-assets/mimick/logo.png" alt="Mimick logo" width="96" height="96" />
  </div>
  <div class="mimick-hero-body">
    <p class="mimick-hero-tagline">Desktop Immich client for Linux</p>
    <p class="mimick-hero-desc">A desktop Immich client combining a persistent sync engine with a modern GTK4 interface. Monitors folders, manages upload queues, and adapts to network and power conditions. Users configure, monitor, and control the app via a settings window and system tray icon.</p>
    <div class="mimick-hero-meta">
      <span class="mimick-meta-badge">v9.3.0</span>
      <span class="mimick-meta-badge">Rust + Tokio</span>
      <span class="mimick-meta-badge">GTK4 / Libadwaita</span>
      <span class="mimick-meta-badge">GPLv3</span>
      <span class="mimick-meta-badge">Immich v1.118+</span>
    </div>
  </div>
</div>

---

## Interface

<div class="mimick-screenshot-grid">
  <figure class="mimick-screenshot">
    <img src="/project-assets/mimick/setup_window.png" alt="Settings window showing connectivity, behavior, watch folders, and folder rules configuration" loading="lazy" decoding="async" />
    <figcaption>Settings &mdash; connectivity, behavior toggles, watch folders with per-folder album targets and rule configuration</figcaption>
  </figure>
  <figure class="mimick-screenshot">
    <img src="/project-assets/mimick/control_window.png" alt="Status page showing sync health dashboard with server route, queue health, and action buttons" loading="lazy" decoding="async" />
    <figcaption>Status &mdash; health dashboard with server route, pending items, retry count, and manual sync controls</figcaption>
  </figure>
  <figure class="mimick-screenshot">
    <img src="/project-assets/mimick/queue_inspector_window.png" alt="Queue inspector showing failed retry queue and recent queue activity with per-item retry actions" loading="lazy" decoding="async" />
    <figcaption>Queue Inspector &mdash; failed item visibility, per-item retry, retry-all, and clear actions</figcaption>
  </figure>
  <figure class="mimick-screenshot">
    <img src="/project-assets/mimick/about_dialog.png" alt="About dialog showing Mimick logo, version, and links" loading="lazy" decoding="async" />
    <figcaption>About &mdash; native Libadwaita dialog with version, website, issue tracker, and credits</figcaption>
  </figure>
  <figure class="mimick-screenshot">
    <img src="/project-assets/mimick/ping_test_screenshot.png" alt="Connection test dialog showing Internal OK, External OK, Active Mode LAN" loading="lazy" decoding="async" />
    <figcaption>Ping Test &mdash; async connectivity probe for LAN/WAN endpoints without UI freeze</figcaption>
  </figure>
  <figure class="mimick-screenshot">
    <img src="/project-assets/mimick/tray_icon_screenshot.png" alt="System tray showing Mimick icon alongside other system indicators" loading="lazy" decoding="async" />
    <figcaption>Tray &mdash; StatusNotifierItem icon for background daemon control and quick settings access</figcaption>
  </figure>
</div>

---

## Architecture

Single-process Rust daemon using the GTK4/Tokio runtime. All upload workers, state, and UI share one process with zero IPC overhead.

<div class="mimick-arch-grid">
  <div class="mimick-arch-card">
    <h3>File Monitor</h3>
    <p><code>notify</code> crate for inotify events. Falls back to polling inside Flatpak for portal-backed directories. 2-second debounce per path, async <code>wait_for_file_completion</code> for settling detection, per-folder rule enforcement before queuing.</p>
  </div>
  <div class="mimick-arch-card">
    <h3>Queue Manager</h3>
    <p>Thread-safe upload orchestrator with 1-10 configurable async workers sharing one <code>mpsc::Receiver</code>. In-memory retry list flushed to disk only on graceful shutdown. Supports pause/resume, sync-now, per-item retry, retry-all, and environment-aware deferral.</p>
  </div>
  <div class="mimick-arch-card">
    <h3>API Client</h3>
    <p>LAN-first, WAN-fallback connectivity. Streams files via <code>reqwest::multipart::Part::stream_with_length</code> with zero RAM buffering. Full 40-char SHA-1 as <code>device_asset_id</code> for Immich server-side deduplication. Single shared <code>OnceLock</code> connection pool.</p>
  </div>
  <div class="mimick-arch-card">
    <h3>Settings UI</h3>
    <p>Built once per process via <code>adw::PreferencesWindow</code>, hidden on close. 500ms polling timer reads <code>Arc&lt;Mutex&lt;AppState&gt;&gt;</code> with zero disk I/O. Live <code>Save Changes</code> updates running daemon without restart. Adaptive layout down to 360px.</p>
  </div>
  <div class="mimick-arch-card">
    <h3>System Tray</h3>
    <p><code>ksni</code> crate for D-Bus StatusNotifierItem. Signals sent to GTK main loop via <code>tokio::sync::watch</code> channel. No child process spawned. Graceful fallback when <code>org.kde.StatusNotifierWatcher</code> is unavailable.</p>
  </div>
  <div class="mimick-arch-card">
    <h3>Credential Store</h3>
    <p><code>oo7</code> keyring crate. Inside Flatpak: portal-encrypted file within sandbox. Native installs: desktop D-Bus Secret Service (GNOME Keyring, KWallet). API keys never written to config files on disk.</p>
  </div>
</div>

---

## Sync Engine

<div class="mimick-spec-list">
  <div class="mimick-spec-item">
    <strong>Concurrent Uploads</strong>
    <span>1-10 configurable async workers with flat memory footprint regardless of file size</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Deduplication</strong>
    <span>SHA-1 checksumming (64KB chunked, <code>spawn_blocking</code>) matches Immich mobile app payload logic</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Atomic Monitoring</strong>
    <span>Delays queuing until file sizes stabilize and write locks are released, preventing partial uploads</span>
  </div>
  <div class="mimick-spec-item">
    <strong>One-Way Sync</strong>
    <span>Strictly read-only access to local files. Never deletes or downloads from the server</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Crash Recovery</strong>
    <span>Persistent retry queue at <code>~/.cache/mimick/retries.json</code> survives daemon restarts and reboots</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Startup Catch-Up</strong>
    <span>Three modes: Full Scan, Recent Changed Only (7 days), and New Files Only. Uses sync index to skip known files</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Album Reassociation</strong>
    <span>Changing a folder's target album re-binds files to the new album without re-uploading data</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Network Routing</strong>
    <span>LAN-first, WAN-fallback with automatic re-negotiation on connectivity changes</span>
  </div>
</div>

---

## Desktop Integration

<div class="mimick-spec-list">
  <div class="mimick-spec-item">
    <strong>Power Awareness</strong>
    <span>Defers uploads on metered networks (<code>nmcli</code>) and battery power (<code>/sys/class/power_supply</code>)</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Quiet Hours</strong>
    <span>Configurable time window to globally suspend uploads</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Sandbox Security</strong>
    <span>Flatpak portal file-choosers grant isolated, per-directory access. No <code>--filesystem=home</code></span>
  </div>
  <div class="mimick-spec-item">
    <strong>Autostart</strong>
    <span>Desktop portal background permission in Flatpak, standard <code>~/.config/autostart/</code> entry natively</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Notifications</strong>
    <span>Batch sync-complete summary via <code>gio::Notification</code>. Dedicated connectivity-loss alert. Global enable/disable toggle</span>
  </div>
  <div class="mimick-spec-item">
    <strong>Diagnostics Export</strong>
    <span>Redacted support bundle: <code>summary.txt</code>, <code>config.redacted.json</code>, <code>status.redacted.json</code>, <code>retries.redacted.json</code>, <code>synced_index.redacted.json</code></span>
  </div>
</div>

---

## Per-Folder Rules

Each watched directory operates with isolated constraints:

- Static or dynamically generated Immich album targets
- Hidden path (dotfile) omission
- Extension allowlists (e.g. `.avif`, `.mp4`, `.heic`, `.jxl`)
- Maximum file size ceilings
- Per-folder sync status: pending count, last sync time, target album, last error

---

## Tech Stack

<table class="data-table">
  <tr><th>Language</th><td>Rust (Edition 2024)</td></tr>
  <tr><th>Async Runtime</th><td>Tokio (multi-thread, fs, sync, process)</td></tr>
  <tr><th>UI Framework</th><td>GTK4 4.12+ / Libadwaita 1.4+</td></tr>
  <tr><th>HTTP Client</th><td>reqwest (native-tls, HTTP/2, streaming multipart)</td></tr>
  <tr><th>System Tray</th><td>ksni (D-Bus StatusNotifierItem)</td></tr>
  <tr><th>Keyring</th><td>oo7 (portal-encrypted file or D-Bus Secret Service)</td></tr>
  <tr><th>File Watcher</th><td>notify (inotify + polling fallback)</td></tr>
  <tr><th>Logging</th><td>flexi_logger (colored console + rotating file, ~2 MB x 5)</td></tr>
  <tr><th>Packaging</th><td>Flatpak (GNOME 50 runtime), signed GPG repo</td></tr>
  <tr><th>Release Binary</th><td>~2 MB (LTO, strip, panic=abort, opt-level=z)</td></tr>
  <tr><th>Tests</th><td>47 unit tests across 13 modules</td></tr>
  <tr><th>CI Pipeline</th><td>CodeQL, cargo fmt/clippy/test --locked, dependency audit</td></tr>
</table>

---

## Installation

### Flatpak (Recommended)

```bash
# Add the official signed repository
flatpak remote-add --user --if-not-exists mimick-repo \
  https://nicx17.github.io/mimick/mimick.flatpakrepo

# Install
flatpak install --user mimick-repo io.github.nicx17.mimick
```

<div class="mimick-note">
  <strong>Repo Signing Key Fingerprint</strong>
  <code>04E2 9556 E951 B2EA 15D3 A8EE 632E 1BC5 D956 579C</code>
</div>

### Build from Source

```bash
# Prerequisites: Rust toolchain + GTK4/Libadwaita dev headers
# Ubuntu/Debian:
sudo apt install libgtk-4-dev libadwaita-1-dev libglib2.0-dev pkg-config build-essential

git clone https://github.com/nicx17/mimick.git
cd mimick
cargo build --release

# Run
cargo run                   # background daemon mode
cargo run -- --settings     # open settings window immediately
```

---

## Project History

Mimick started as a Python/PySide6 sync script called "ImmichSync" and was fully rewritten in Rust with GTK4 for version 3.0. The rewrite dropped the binary size from ~80 MB (PyInstaller bundle) to ~2 MB, eliminated the Python runtime dependency, and introduced concurrent streaming uploads with constant RAM usage.

Key milestones:

- **v0.1.0** -- Initial Python release with PySide6 UI
- **v2.0.0** -- Rebrand to Mimick, migrate to GTK4/Libadwaita
- **v3.0.0** -- Complete Rust port with Tokio async runtime
- **v5.0.0** -- Flatpak packaging with signed GPG repo, portal-based folder access
- **v7.0.0** -- Queue inspector, per-folder rules, diagnostics export, environment-aware pausing
- **v8.0.0** -- Health dashboard, permission checks, first-run wizard, mobile-responsive UI (360px)
- **v9.0.0** -- Live settings apply without restart, fixed timestamp regression
- **v9.3.0** -- Keyring migration to `oo7` crate, notification toggle, batch sync summaries

---

## License

GNU General Public License v3.0

<style>
/* Mimick Product Page Styles */

.mimick-hero {
  display: flex;
  align-items: flex-start;
  gap: 1.4rem;
  padding: 1.6rem 0 0.8rem;
}

.mimick-hero-logo {
  flex: 0 0 auto;
}

.mimick-hero-logo img {
  width: 96px;
  height: 96px;
  border-radius: 22px;
  box-shadow:
    0 12px 28px -8px rgba(0, 0, 0, 0.18),
    0 0 0 1px var(--border-color);
}

.mimick-hero-body {
  flex: 1;
  min-width: 0;
}

.mimick-hero-tagline {
  margin: 0 0 0.45rem;
  font-size: 1.32rem;
  font-weight: 700;
  letter-spacing: -0.014em;
  line-height: 1.2;
  color: var(--text-main);
}

.mimick-hero-desc {
  margin: 0 0 0.9rem;
  color: var(--text-muted);
  line-height: 1.62;
  font-size: 0.95rem;
}

.mimick-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.mimick-meta-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.62rem;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--button-bg);
  color: var(--text-soft);
}

/* Screenshot Gallery */
.mimick-screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.2rem;
  margin: 1rem 0;
  align-items: start;
}

.mimick-screenshot {
  margin: 0;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  background: var(--button-bg);
  transition:
    transform var(--motion-hover) var(--ease-sleek),
    box-shadow var(--motion-hover) var(--ease-sleek),
    border-color var(--motion-medium) ease;
}

.mimick-screenshot:hover {
  transform: translateY(-4px) scale(1.006);
  border-color: var(--border-hover);
  box-shadow: 0 24px 48px -24px var(--shadow-main);
}

.mimick-screenshot img {
  width: 100%;
  height: auto;
  display: block;
  cursor: zoom-in;
}

/* Lightbox Overlay */
.mimick-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: zoom-out;
  opacity: 0;
  visibility: hidden;
  transition: opacity 260ms ease, visibility 260ms ease;
}

.mimick-lightbox.is-active {
  opacity: 1;
  visibility: visible;
}

.mimick-lightbox img {
  max-width: 92vw;
  max-height: 92vh;
  border-radius: 12px;
  box-shadow: 0 32px 80px -16px rgba(0, 0, 0, 0.6);
  transform: scale(0.92);
  transition: transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.mimick-lightbox.is-active img {
  transform: scale(1);
}

.mimick-screenshot figcaption {
  padding: 0.72rem 0.88rem;
  font-size: 0.82rem;
  line-height: 1.48;
  color: var(--text-muted);
  border-top: 1px solid var(--border-color);
}

/* Architecture Cards */
.mimick-arch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.95rem;
  margin: 1rem 0;
}

.mimick-arch-card {
  padding: 1.1rem 1.15rem;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background:
    linear-gradient(155deg, var(--button-bg), var(--glass-bg-strong));
  transition:
    border-color var(--motion-medium) ease,
    transform var(--motion-hover) var(--ease-sleek),
    box-shadow var(--motion-hover) var(--ease-sleek);
}

.mimick-arch-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-3px);
  box-shadow: 0 18px 36px -18px var(--shadow-main);
}

.mimick-arch-card h3 {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-main);
}

.mimick-arch-card p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.58;
  color: var(--text-muted);
}

.mimick-arch-card code {
  font-size: 0.82rem;
  padding: 0.1rem 0.34rem;
  border-radius: 5px;
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

/* Spec List */
.mimick-spec-list {
  display: grid;
  gap: 0;
  margin: 1rem 0;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  background: var(--button-bg);
}

.mimick-spec-item {
  display: grid;
  grid-template-columns: 11rem 1fr;
  gap: 0.8rem;
  padding: 0.82rem 1.1rem;
  align-items: baseline;
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--motion-fast) ease;
}

.mimick-spec-item:last-child {
  border-bottom: none;
}

.mimick-spec-item:hover {
  background: var(--button-bg-hover);
}

.mimick-spec-item strong {
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: -0.005em;
  color: var(--text-main);
  white-space: nowrap;
}

.mimick-spec-item span {
  font-size: 0.88rem;
  line-height: 1.52;
  color: var(--text-muted);
}

.mimick-spec-item code {
  font-size: 0.8rem;
  padding: 0.08rem 0.3rem;
  border-radius: 4px;
  background: var(--glass-bg-strong);
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

/* Note Block */
.mimick-note {
  padding: 0.85rem 1.1rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--button-bg);
  margin: 0.8rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mimick-note strong {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-soft);
}

.mimick-note code {
  font-size: 0.84rem;
  color: var(--text-main);
  word-break: break-all;
}

/* Responsive */
@media (max-width: 720px) {
  .mimick-hero {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    text-align: center;
  }

  .mimick-hero-meta {
    justify-content: center;
  }

  .mimick-screenshot-grid {
    grid-template-columns: 1fr;
  }

  .mimick-arch-grid {
    grid-template-columns: 1fr;
  }

  .mimick-spec-item {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
}
</style>

<script type="module">
const overlay = document.createElement('div');
overlay.className = 'mimick-lightbox';
overlay.innerHTML = '<img alt="" />';
document.body.appendChild(overlay);

const overlayImg = overlay.querySelector('img');

document.querySelectorAll('.mimick-screenshot img').forEach(img => {
  img.addEventListener('click', () => {
    overlayImg.src = img.src;
    overlayImg.alt = img.alt;
    requestAnimationFrame(() => overlay.classList.add('is-active'));
  });
});

overlay.addEventListener('click', () => {
  overlay.classList.remove('is-active');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
    overlay.classList.remove('is-active');
  }
});
</script>
